"""
preprocess.py – Load, clean, and standardise the narrative dataset.

Usage
-----
  python preprocess.py \
      --input  data/english/sample_schema.csv \
      --output data/english/sample_schema_clean.csv \
      --language english

  python preprocess.py \
      --input  data/hindi/sample_schema.csv \
      --output data/hindi/sample_schema_clean.csv \
      --language hindi
"""

import argparse
import pandas as pd
from utils import extract_answer, clean_text_general, clean_hindi_text


COLUMN_MAP = {
    # Raw column name variations → canonical name
    "Story":              "story",
    "DeepSeekR1Story":    "story_with_thinking",
    "prompt_description": "personality_level",
    "promptdescription":  "personality_level",
    "persona":            "occupation",
    "scenariocontext":    "scenario_context",
}

REQUIRED_COLUMNS = [
    "occupation", "gender", "artifact", "scenario_context",
    "personality", "personality_level", "personality_prompt", "story",
]


def load_data(path: str) -> pd.DataFrame:
    """Load CSV or Excel file."""
    if path.endswith((".xlsx", ".xls")):
        return pd.read_excel(path)
    return pd.read_csv(path)


def normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lowercase and standardise column names."""
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace(r"[^a-z0-9_]", "", regex=True)
    )
    df.rename(columns={k.lower(): v for k, v in COLUMN_MAP.items()}, inplace=True)
    return df


def extract_deepseek_answers(df: pd.DataFrame) -> pd.DataFrame:
    """If a chain-of-thought column exists, extract the final answer into 'story'."""
    if "story_with_thinking" in df.columns:
        df["story"] = df["story_with_thinking"].apply(extract_answer)
    return df


def clean_dataset(df: pd.DataFrame, language: str) -> pd.DataFrame:
    """Apply text cleaning appropriate for the target language."""
    text_cols = [c for c in df.columns if c not in
                 ("occupation", "gender", "artifact", "personality",
                  "personality_level", "personality_prompt", "scenario_context")]

    for col in text_cols:
        if col in df.columns:
            df[col] = clean_text_general(df[col])

    if language == "hindi" and "story" in df.columns:
        df["story"] = clean_hindi_text(df["story"])

    return df


def validate(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns after preprocessing: {missing}")
    null_story = df["story"].isna().sum()
    if null_story:
        print(f"Warning: {null_story} rows have null story values and will be skipped in evaluation.")


def main():
    parser = argparse.ArgumentParser(description="Preprocess narrative dataset.")
    parser.add_argument("--input",    required=True,  help="Path to raw input CSV or Excel file.")
    parser.add_argument("--output",   required=True,  help="Path for cleaned output CSV file.")
    parser.add_argument("--language", required=True,  choices=["english", "hindi"],
                        help="Language of the story column.")
    args = parser.parse_args()

    df = load_data(args.input)
    df = normalise_columns(df)
    df = extract_deepseek_answers(df)
    df = clean_dataset(df, args.language)
    validate(df)

    df.to_csv(args.output, index=False, encoding='utf-8-sig')
    print(f"Saved {len(df)} rows -> {args.output}")


if __name__ == "__main__":
    main()
