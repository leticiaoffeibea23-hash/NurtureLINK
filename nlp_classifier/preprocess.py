"""Text preprocessing for dietary-recall free text.

This research component intentionally uses a small, dependency-light pipeline so
that preprocessing is easy to audit. It does not require NLTK, spaCy, or an
external API.
"""
import re

STOPWORDS = {
    "the", "a", "an", "and", "with", "for", "at", "in", "on", "today", "this",
    "morning", "evening", "afternoon", "night", "she", "he", "the", "was",
    "is", "are", "took", "had", "ate", "given", "then", "later", "some",
    "of", "to", "her", "him", "child", "baby", "infant", "only", "still",
    "before", "bed", "plus", "yesterday", "now", "just", "also", "too",
}

_WORD_RE = re.compile(r"[a-z]+")


def clean_text(text: str) -> str:
    """Normalize a dietary-recall sentence for TF-IDF features.

    Steps:
    - lowercase;
    - normalize common breastfeeding variants to ``breastmilk``;
    - keep alphabetic tokens only;
    - remove a small hand-written stopword list.

    The function deliberately avoids English stemming/lemmatization because
    local food names such as ``zogale``, ``tuo zaafi``, and ``amani`` should not
    be altered by an English-language stemmer.
    """
    text = text.lower()
    text = re.sub(r"\bbreast\s+milk\b", "breastmilk", text)
    text = re.sub(r"\bbreastfeeding\b", "breastmilk", text)
    text = re.sub(r"\bbreastfed\b", "breastmilk", text)
    tokens = _WORD_RE.findall(text)
    tokens = [token for token in tokens if token not in STOPWORDS]
    return " ".join(tokens)


if __name__ == "__main__":
    examples = [
        "She ate tuo zaafi with groundnut soup and a boiled egg for breakfast, and rice in the evening.",
        "The infant took only breast milk this morning.",
    ]
    for example in examples:
        print(repr(example))
        print(" ->", repr(clean_text(example)))
        print()
