"""Inference wrapper for the experimental dietary-recall classifier.

The Python model is a research artifact and is not yet wired into the React
Native application. A mobile deployment would require a compatible on-device
runtime or model conversion plus validation on field-collected text.
"""
from pathlib import Path

import joblib

from preprocess import clean_text
from train import ALL_LABELS

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

_vectorizer = None
_classifier = None


def _load():
    global _vectorizer, _classifier
    if _vectorizer is not None:
        return

    vectorizer_path = MODEL_DIR / "vectorizer.joblib"
    classifier_path = MODEL_DIR / "classifier.joblib"
    if not vectorizer_path.exists() or not classifier_path.exists():
        raise FileNotFoundError(
            "Trained model artifacts are missing. Run `python generate_dataset.py` "
            "and `python train.py` from the nlp_classifier directory first."
        )

    _vectorizer = joblib.load(vectorizer_path)
    _classifier = joblib.load(classifier_path)


def predict_food_groups(text: str) -> dict:
    """Return ``{\"food_groups\": [...]}`` for one free-text recall sentence."""
    if not clean_text(text).strip():
        return {"food_groups": []}

    _load()
    x = _vectorizer.transform([clean_text(text)])
    prediction = _classifier.predict(x)[0]
    groups = [ALL_LABELS[i] for i, value in enumerate(prediction) if value]
    return {"food_groups": groups}


def predict_with_confidence(text: str) -> dict:
    """Return predicted groups plus per-label logistic probabilities."""
    if not clean_text(text).strip():
        return {"food_groups": [], "confidence": {}}

    _load()
    x = _vectorizer.transform([clean_text(text)])
    probabilities = _classifier.predict_proba(x)[0]
    prediction = _classifier.predict(x)[0]
    groups = [ALL_LABELS[i] for i, value in enumerate(prediction) if value]
    confidence = {
        ALL_LABELS[i]: round(float(probabilities[i]), 3)
        for i in range(len(ALL_LABELS))
    }
    return {"food_groups": groups, "confidence": confidence}


if __name__ == "__main__":
    examples = [
        "She ate tuo zaafi with groundnut soup and a boiled egg for breakfast, and rice in the evening.",
        "The baby is still exclusively breastfeeding, nothing else today.",
        "He had zogale leaves and dried fish today.",
    ]
    for example in examples:
        print(example)
        print(" ->", predict_food_groups(example))
        print()
