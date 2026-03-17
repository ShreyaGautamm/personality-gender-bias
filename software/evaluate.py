"""
evaluate.py – Compute sentence-level gender-bias scores against stereotype centroids.

For each narrative, the pipeline:
  1. Splits the story into sentences.
  2. Encodes all sentences with a SentenceTransformer model.
  3. Computes cosine similarity of each sentence to the male and female centroids.
  4. Selects the sentence with the highest absolute male-female similarity difference.
  5. Records that sentence's male_sim, female_sim, and their difference.

Usage
-----
  # Personality-conditioned evaluation
  python evaluate.py \
      --input      data/english/sample_schema_clean.csv \
      --centroids  data/english/centroids.npz \
      --output     data/english/bias_scores.csv \
      --language   english \
      --model-name sample

  # Baseline (gender-only) evaluation
  python evaluate.py \
      --input      data/english/baseline_schema_clean.csv \
      --centroids  data/english/centroids.npz \
      --output     data/english/baseline_scores.csv \
      --language   english \
      --model-name sample \
      --baseline
"""

import argparse
import numpy as np
import pandas as pd
from sklearn.preprocessing import normalize
from sentence_transformers import SentenceTransformer
from tqdm.auto import tqdm

MODEL_MAP = {
    "english": "l3cube-pune/indic-sentence-similarity-sbert",
    "hindi":   "sentence-transformers/LaBSE",
}

ALL_PERSONALITIES = [
    "honesty-humility", "emotionality", "extraversion",
    "agreeableness", "conscientiousness", "openness to experience",
    "machiavellianism", "narcissism", "psychopathy",
]


def load_centroids(path: str) -> dict:
    data = np.load(path)
    return {k: data[k] for k in data.files}


def score_personality_conditioned(
    df: pd.DataFrame,
    model: SentenceTransformer,
    centroids: dict,
    model_name: str,
    personalities: list = None,
    text_col: str = "story",
    batch_size: int = 64,
    sentence_delimiter: str = ".",
) -> pd.DataFrame:
    """
    Sentence-level bias scoring for personality-conditioned narratives.

    Parameters
    ----------
    df            : Cleaned stories dataframe.
    model         : Loaded SentenceTransformer.
    centroids     : Dict with 'male_stereotype' and 'female_stereotype' vectors.
    model_name    : Label for the LLM that generated the stories.
    personalities : Subset of personality traits to evaluate (default: all nine).
    text_col      : Column containing the narrative text.
    batch_size    : Encoding batch size.
    sentence_delimiter : Token used to split stories into sentences.

    Returns
    -------
    DataFrame with columns: model, occupation, gender, personality,
    personality_level, male_stereotype_sim, female_stereotype_sim, average_difference.
    """
    if personalities is None:
        personalities = ALL_PERSONALITIES

    male_c   = normalize(centroids["male_stereotype"].reshape(1, -1),   axis=1)[0]
    female_c = normalize(centroids["female_stereotype"].reshape(1, -1), axis=1)[0]

    valid_df = df[df["personality"].isin(personalities)].copy()
    valid_df = valid_df[
        valid_df[text_col].notna() &
        valid_df[text_col].astype(str).str.strip().ne("")
    ]

    results = []
    for row in tqdm(valid_df.itertuples(index=False),
                    total=len(valid_df), desc="Scoring rows"):
        text      = str(getattr(row, text_col))
        sentences = [s.strip() for s in text.split(sentence_delimiter) if s.strip()]
        if not sentences:
            continue

        emb = normalize(
            model.encode(sentences, batch_size=batch_size,
                         convert_to_numpy=True, show_progress_bar=False)
        )
        male_sims   = emb @ male_c
        female_sims = emb @ female_c
        diffs       = male_sims - female_sims
        idx         = int(np.argmax(np.abs(diffs)))

        results.append({
            "model":               model_name,
            "occupation":          row.occupation,
            "gender":              row.gender,
            "personality":         row.personality,
            "personality_level":   row.personality_level,
            "male_stereotype_sim": float(male_sims[idx]),
            "female_stereotype_sim": float(female_sims[idx]),
        })

    out = pd.DataFrame(results)
    out["average_difference"] = (
        out["male_stereotype_sim"] - out["female_stereotype_sim"]
    )
    return out


def score_baseline(
    df: pd.DataFrame,
    model: SentenceTransformer,
    centroids: dict,
    model_name: str,
    text_col: str = "story",
    batch_size: int = 64,
    sentence_delimiter: str = ".",
) -> pd.DataFrame:
    """
    Sentence-level bias scoring for baseline (no-personality) narratives.
    Mirrors score_personality_conditioned but operates on gender-conditioned
    prompts without personality traits.
    """
    male_c   = normalize(centroids["male_stereotype"].reshape(1, -1),   axis=1)[0]
    female_c = normalize(centroids["female_stereotype"].reshape(1, -1), axis=1)[0]

    valid_df = df[
        df[text_col].notna() &
        df[text_col].astype(str).str.strip().ne("")
    ].copy()

    results = []
    for row in tqdm(valid_df.itertuples(index=False),
                    total=len(valid_df), desc="Scoring baseline"):
        text      = str(getattr(row, text_col))
        sentences = [s.strip() for s in text.split(sentence_delimiter) if s.strip()]
        if not sentences:
            continue

        emb = normalize(
            model.encode(sentences, batch_size=batch_size,
                         convert_to_numpy=True, show_progress_bar=False)
        )
        male_sims   = emb @ male_c
        female_sims = emb @ female_c
        diffs       = male_sims - female_sims
        idx         = int(np.argmax(np.abs(diffs)))

        results.append({
            "model":               model_name,
            "occupation":          row.occupation,
            "gender":              getattr(row, "gender", "neutral"),
            "personality":         "baseline_neutral",
            "personality_level":   "neutral",
            "male_stereotype_sim": float(male_sims[idx]),
            "female_stereotype_sim": float(female_sims[idx]),
            "analysis_type":       "baseline",
        })

    out = pd.DataFrame(results)
    out["average_difference"] = (
        out["male_stereotype_sim"] - out["female_stereotype_sim"]
    )
    return out


def main():
    parser = argparse.ArgumentParser(description="Evaluate gender-bias scores.")
    parser.add_argument("--input",      required=True,  help="Cleaned stories CSV.")
    parser.add_argument("--centroids",  required=True,  help="Centroids .npz file.")
    parser.add_argument("--output",     required=True,  help="Output bias scores CSV.")
    parser.add_argument("--language",   required=True,  choices=["english", "hindi"])
    parser.add_argument("--model-name", required=True,
                        help="Label for the LLM that generated the stories (e.g. llama).")
    parser.add_argument("--model",      default=None,
                        help="Override the default SentenceTransformer model.")
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--baseline",   action="store_true",
                        help="Run baseline (gender-only) evaluation instead.")
    args = parser.parse_args()

    model_name = args.model or MODEL_MAP[args.language]
    print(f"Loading embedding model: {model_name}")
    embedding_model = SentenceTransformer(model_name)

    df        = pd.read_csv(args.input)
    centroids = load_centroids(args.centroids)

    if args.baseline:
        results = score_baseline(
            df, embedding_model, centroids,
            model_name=args.model_name, batch_size=args.batch_size,
        )
    else:
        results = score_personality_conditioned(
            df, embedding_model, centroids,
            model_name=args.model_name, batch_size=args.batch_size,
        )

    results.to_csv(args.output, index=False, encoding='utf-8-sig')
    print(f"Bias scores saved -> {args.output}  ({len(results)} rows)")


if __name__ == "__main__":
    main()
