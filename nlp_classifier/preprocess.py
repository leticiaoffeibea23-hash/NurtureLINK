"""
Text preprocessing for dietary-recall free text.

Kept deliberately simple and dependency-light (no spaCy/NLTK download required)
so it can eventually run inside a constrained mobile/edge environment, consistent
with the project's on-device, offline-first architecture (README §11).
"""
import re

# Minimal stopword list — recall sentences are short, connective words carry
# little signal for food-group classification and only add noise to TF-IDF.
STOPWORDS = {
    "the", "a", "an", "and", "with", "for", "at", "in", "on", "today", "this",
    "morning", "evening", "afternoon", "night", "she", "he", "the", "was",
    "is", "are", "took", "had", "ate", "given", "then", "later", "some",
    "of", "to", "her", "him", "child", "baby", "infant", "only", "still",
    "before", "bed", "plus", "yesterday", "now", "just", "also", "too",
}

_word_re = re.compile(r"[a-z]+")


def clean_text(text: str) -> str:
    """Lowercase, strip punctuation, remove stopwords, collapse whitespace.

    Deliberately does NOT stem/lemmatize: food names like 'zogale', 'tuo
    zaafi', 'amani' are local-language proper nouns where naive English
    stemming would corrupt the token rather than normalize it. The TF-IDF
    vectorizer's word + bigram n-grams handle multi-word food names like
    'boiled egg' or 'tuo zaafi' without needing a stemmer.
    """
    text = text.lower()
    # Normalize a common spelling variant so the same concept does not split
    # across unigram/bigram features.
    text = re.sub(r"\bbreast\s+milk\b", "breastmilk", text)
    tokens = _word_re.findall(text)
    tokens = [t for t in tokens if t not in STOPWORDS]
    return " ".join(tokens)


if __name__ == "__main__":
    examples = [
        "She ate tuo zaafi with groundnut soup and a boiled egg for breakfast, and rice in the evening.",
        "The baby is still exclusively breastfeeding, nothing else today.",
    ]
    for e in examples:
        print(repr(e))
        print(" ->", repr(clean_text(e)))
        print()
