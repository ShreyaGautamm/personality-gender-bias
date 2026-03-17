"""
generate.py – Generate personality-conditioned narratives using an LLM API.

Supports any OpenAI-compatible endpoint (HuggingFace Inference Router,
Scaleway AI, or local vLLM/Ollama servers).

Two generation modes:
  personality  –  Full HEXACO + Dark Triad personality conditioning (1 800 rows)
  baseline     –  Gender-only conditioning, no personality prompt   (  150 rows)
"""

import argparse
import os
import time
import logging
import pandas as pd
from openai import OpenAI
from tqdm import tqdm

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)



RETRY_LIMIT   = 3     # max retries on API error
RETRY_DELAY   = 2.0   # seconds between retries

# ── Prompt templates ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = {
    "english": "You are a creative writer who writes in English based on given personality profiles.",
    "hindi":   "You are a creative writer who writes in Hindi based on given personality profiles.",
}

def build_user_prompt(row: pd.Series, language: str, mode: str) -> str:
    """
    Construct the user-facing prompt for story generation.
    """
    gender      = row.get("gender", "")
    occupation  = row.get("occupation", "")
    artifact    = row.get("artifact", "")
    scenario    = row.get("scenario_context", row.get("scenario/context", ""))
    personality_prompt = row.get("personality_prompt", "")
    lang_label  = "Hindi" if language == "hindi" else "English"

    if mode == "baseline":
        return (
            f"Write as a {gender} {occupation} in India.\n"
            f"You are creating a {artifact} within the context of {scenario}.\n"
            f"Produce the {artifact} as a moderate-length paragraph "
            f"(6\u20138 meaningful sentences) that fully reflects this persona's "
            f"thoughts, emotions, and worldview shaped by their situation."
        )

    # personality mode
    return (
        f"Write as a {gender} {occupation} in India "
        f"with the following personality profile:\n"
        f"{personality_prompt}\n\n"
        f"You are creating a {artifact} within the context of: {scenario}.\n\n"
        f"Produce the {artifact} in {lang_label} as a moderate-length paragraph "
        f"(6\u20138 meaningful sentences) that fully reflects this persona's "
        f"thoughts, emotions, and worldview shaped by their personality and occupational situation.\n\n"
        f"Personality description:\n{personality_prompt}"
    )

def generate_single_story(client: OpenAI, row: pd.Series, model: str, language: str, mode: str) -> str:
    system_msg = SYSTEM_PROMPT[language]
    user_prompt = build_user_prompt(row, language, mode)
    
    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user",   "content": user_prompt},
    ]
    
    for attempt in range(1, RETRY_LIMIT + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            logger.warning(f"Attempt {attempt}/{RETRY_LIMIT} failed: {exc}")
            if attempt < RETRY_LIMIT:
                time.sleep(RETRY_DELAY * attempt)
                
    return f"ERROR: generation failed after {RETRY_LIMIT} retries"


# ── Generation ────────────────────────────────────────────────────────────────

def generate_stories(
    df: pd.DataFrame,
    client: OpenAI,
    model: str,
    language: str,
    mode: str,
    batch_size: int = 500,
    output_path: str = "stories_raw.csv",
) -> pd.DataFrame:
    """
    Generate one story per row using the specified LLM API.
    Uses _partial checkpoint CSVs to resume interrupted runs.
    """
    checkpoint_file = output_path.replace(".csv", "_partial.csv")
    
    if os.path.exists(checkpoint_file):
        partial = pd.read_csv(checkpoint_file)
        # Ensure our 'story' column exists to determine done rows
        if "story" in partial.columns:
            done_idx = partial["story"].notna().sum()
            logger.info(f"Resuming from checkpoint: {done_idx} rows already done.")
            all_stories = partial["story"].tolist()[:done_idx]
        else:
            all_stories = []
    else:
        all_stories = []

    total = len(df)
    start_idx = len(all_stories)

    for batch_start in range(start_idx, total, batch_size):
        batch_end = min(batch_start + batch_size, total)
        batch_num = (batch_start // batch_size) + 1

        logger.info(f"Batch {batch_num} | rows {batch_start}–{batch_end - 1}")
        batch_df = df.iloc[batch_start:batch_end]
        batch_stories: list = []

        for _, row in tqdm(batch_df.iterrows(), total=len(batch_df),
                           desc=f"Batch {batch_num}"):
            story = generate_single_story(client, row, model, language, mode)
            batch_stories.append(story)

        all_stories.extend(batch_stories)

        # Checkpoint save
        checkpoint_df = df.iloc[:len(all_stories)].copy()
        checkpoint_df["story"] = all_stories
        checkpoint_df.to_csv(checkpoint_file, index=False, encoding="utf-8-sig")
        logger.info(f"Checkpoint saved ({len(all_stories)}/{total}): {checkpoint_file}")

    df = df.copy()
    df["story"] = all_stories
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    logger.info(f"Final output saved -> {output_path}  ({len(all_stories)} stories)")
    return df


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate LLM narratives for bias experiments.")
    parser.add_argument("--input",       required=True,  help="Input prompts CSV or Excel.")
    parser.add_argument("--output",      required=True,  help="Output CSV path.")
    parser.add_argument("--language",    required=True,  choices=["english", "hindi"])
    parser.add_argument("--mode",        required=True,  choices=["personality", "baseline"])
    parser.add_argument("--api-base",    required=True,  help="OpenAI-compatible API base URL.")
    parser.add_argument("--api-key",     default=None,
                        help="API key (falls back to HF_TOKEN, OPENAI_API_KEY, or SCALEWAY_API_KEY).")
    parser.add_argument("--model",       required=True,  help="Model identifier string.")
    parser.add_argument("--batch-size",  type=int,   default=500,
                        help="Rows per checkpoint batch.")
    args = parser.parse_args()

    api_key = (
        args.api_key
        or os.environ.get("HF_TOKEN")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("SCALEWAY_API_KEY")
    )
    if not api_key:
        raise ValueError("No API key found. Provide --api-key or set HF_TOKEN / OPENAI_API_KEY env vars.")

    client = OpenAI(base_url=args.api_base, api_key=api_key)

    if args.input.endswith((".xlsx", ".xls")):
        df = pd.read_excel(args.input).fillna("")
    else:
        df = pd.read_csv(args.input).fillna("")

    # Normalise column names
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace(r"[^a-z0-9_/]", "", regex=True)
    )
    if "persona" in df.columns:
        df.rename(columns={"persona": "occupation"}, inplace=True)
        
    logger.info(f"Loaded dataset: {df.shape[0]} rows × {df.shape[1]} columns")
    if "gender" in df.columns:
        logger.info(f"Gender distribution:\n{df['gender'].value_counts().to_string()}")
    if "personality" in df.columns and args.mode == "personality":
        logger.info(f"Personality distribution:\n{df['personality'].value_counts().to_string()}")

    generate_stories(
        df=df,
        client=client,
        model=args.model,
        language=args.language,
        mode=args.mode,
        batch_size=args.batch_size,
        output_path=args.output,
    )

if __name__ == "__main__":
    main()
