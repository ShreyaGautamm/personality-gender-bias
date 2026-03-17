"""
embed.py – Build gender-stereotype centroids using a sentence-embedding model.

The centroid for each gender is the L2-normalised mean of all template-expanded
stereotype sentences (common nouns + verbs + adjectives).

Usage
-----
  python embed.py \
      --language english \
      --words    data/stereotype_words/english.json \
      --output   data/english/centroids.npz

  python embed.py \
      --language hindi \
      --words    data/stereotype_words/hindi.json \
      --output   data/hindi/centroids.npz
"""

import argparse
import json
import numpy as np
import re
from sklearn.preprocessing import normalize
from sentence_transformers import SentenceTransformer

# ── Model selection per language ──────────────────────────────────────────────
MODEL_MAP = {
    "english": "l3cube-pune/indic-sentence-similarity-sbert",
    "hindi":   "sentence-transformers/LaBSE",
}

# ── Sentence templates per word category ─────────────────────────────────────
SENT_TEMPLATES_EN = {
    "common_nouns": [
        "This is {w}.", "That is {w}.", "There is {w}.",
        "Here is {w}.", "{w} is here.", "{w} is there.",
    ],
    "verbs": [
        "This is {w}.", "That is {w}.", "That is {w}.",
        "This is {w}.", "There is {w}.", "Here is {w}.",
    ],
    "adjectives": [
        "This is {w}.", "That is {w}.", "That is {w}.", "This is {w}.",
    ],
}

# Hindi templates (Devanagari) – parallel structure to English templates.
SENT_TEMPLATES_HI = {
    "common_nouns": [
        "यह {w} है।", "वह {w} है।", "यहाँ {w} है।",
        "वहाँ {w} है।", "{w} यहाँ है।", "{w} वहाँ है।",
    ],
    "verbs": [
        "यह {w} है।", "वह {w} है।", "वह {w} है।",
        "यह {w} है।", "यहाँ {w} है।", "वहाँ {w} है।",
    ],
    "adjectives": [
        "यह {w} है।", "वह {w} है।", "वह {w} है।", "यह {w} है।",
    ],
}

TEMPLATES = {"english": SENT_TEMPLATES_EN, "hindi": SENT_TEMPLATES_HI}


def load_word_lists(path: str) -> dict:
    """Load JSON word lists: {'male': {'common_nouns': [...], ...}, 'female': {...}}"""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def generate_stereotype_sentences(word_dict: dict, templates: dict, label: str) -> list:
    """Expand word lists into template sentences."""
    sentences = []
    for category, words in word_dict.items():
        tmpl_list = templates.get(category, [])
        for t in tmpl_list:
            sentences.extend(t.replace("{w}", w) for w in words)
    print(f"  {label}: {len(sentences)} sentences generated")
    return sentences


def build_centroids(
    word_lists: dict,
    templates: dict,
    model: SentenceTransformer,
    batch_size: int = 64,
) -> dict:
    """
    Encode all stereotype sentences and return L2-normalised mean vectors.

    Returns
    -------
    dict with keys 'male_stereotype' and 'female_stereotype', each a 1-D numpy array.
    """
    centroids = {}
    for gender in ("male", "female"):
        sentences = generate_stereotype_sentences(
            word_lists[gender], templates, f"{gender}_stereotype"
        )
        emb = model.encode(sentences, batch_size=batch_size,
                           convert_to_numpy=True, show_progress_bar=True)
        emb = normalize(emb)
        centroids[f"{gender}_stereotype"] = emb.mean(axis=0)
        print(f"  {gender}_stereotype centroid created  (dim={emb.shape[1]})")
    return centroids


def main():
    parser = argparse.ArgumentParser(description="Build gender-stereotype centroids.")
    parser.add_argument("--language",   required=True, choices=["english", "hindi"])
    parser.add_argument("--words",      required=True, help="JSON file with stereotype word lists.")
    parser.add_argument("--output",     required=True, help="Output .npz file for centroids.")
    parser.add_argument("--model",      default=None,
                        help="Override the default SentenceTransformer model name.")
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()

    model_name = args.model or MODEL_MAP[args.language]
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)

    word_lists = load_word_lists(args.words)
    templates  = TEMPLATES[args.language]

    centroids = build_centroids(word_lists, templates, model, args.batch_size)
    np.savez(args.output, **centroids)
    print(f"Centroids saved → {args.output}")


if __name__ == "__main__":
    main()
