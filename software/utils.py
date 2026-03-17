"""
utils.py – Shared helper functions for preprocessing and evaluation.
"""

import re
import pandas as pd

# ── Regex patterns (pre-compiled for performance) ──────────────────────────
_INVISIBLE   = re.compile(r"[\u200c\u200d]")
_FANCY_DASH  = re.compile(r"[\u2013\u2014]")
_ELLIPSIS    = re.compile(r"\u2026")
_MULTI_DOT   = re.compile(r"\.{2,}")
_MULTI_SPC   = re.compile(r" +")
_ENG_CHARS   = re.compile(r"[A-Za-z0-9]")
_TRAIL_FRAG  = re.compile(r"[A-Za-z]{1,4}$")


def extract_answer(text: str) -> str:
    """Strip <think>…</think> prefix produced by chain-of-thought models (e.g. DeepSeek-R1)."""
    if pd.isna(text):
        return text
    text = str(text)
    if "</think>" in text:
        return text.split("</think>", 1)[1].strip()
    return text


def clean_text_general(series: pd.Series) -> pd.Series:
    """Vectorised punctuation normalisation for any Latin-script column."""
    s = series.fillna("").astype(str)
    s = s.str.replace(_INVISIBLE,  "",    regex=True)
    s = s.str.replace(_FANCY_DASH, "-",   regex=True)
    s = s.str.replace(_ELLIPSIS,   "...", regex=True)
    s = s.str.replace(_MULTI_DOT,  ".",   regex=True)
    s = s.str.replace(_MULTI_SPC,  " ",   regex=True)
    s = s.str.lower().str.strip()
    return s.replace("", pd.NA)


def clean_hindi_text(series: pd.Series) -> pd.Series:
    """
    Remove residual English tokens and trailing Latin fragments
    from Hindi (Devanagari) story text.
    """
    def _process(text):
        if pd.isna(text) or not text:
            return pd.NA
        tokens  = [t for t in text.split() if not _ENG_CHARS.search(t)]
        if not tokens:
            return pd.NA
        cleaned = " ".join(tokens)
        cleaned = _TRAIL_FRAG.sub("", cleaned).strip()
        return cleaned if cleaned else pd.NA

    return series.apply(_process)
