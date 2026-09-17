"""Evaluate the trained classifier on the saved synthetic hold-out split.

These metrics measure performance on template-generated examples from the same
synthetic data-generating process used for training. They are useful for code
verification and model iteration, but are not estimates of real-world CHO
field performance.
"""
import json
from pathlib import Path

import joblib
from sklearn.metrics import classification_report, f1_score

from preprocess import clean_text
from train import ALL_LABELS

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"


def evaluate(model_dir: Path = MODEL_DIR):
    required = [
        model_dir / "vectorizer.joblib",
        model_dir / "classifier.joblib",
        model_dir / "label_binarizer.joblib",
        model_dir / "test_split.json",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Model artifacts are missing. Run `python train.py` first. Missing: "
            + ", ".join(missing)
        )

    vectorizer = joblib.load(model_dir / "vectorizer.joblib")
    classifier = joblib.load(model_dir / "classifier.joblib")
    joblib.load(model_dir / "label_binarizer.joblib")

    with (model_dir / "test_split.json").open(encoding="utf-8") as handle:
        split = json.load(handle)

    test_texts = split["test_texts"]
    y_test = split["test_labels"]
    x_test = vectorizer.transform([clean_text(text) for text in test_texts])
    y_pred = classifier.predict(x_test)

    return {
        "test_texts": test_texts,
        "y_test": y_test,
        "y_pred": y_pred,
        "micro_f1": f1_score(y_test, y_pred, average="micro", zero_division=0),
        "macro_f1": f1_score(y_test, y_pred, average="macro", zero_division=0),
    }


def main():
    result = evaluate()
    print("=" * 70)
    print(f"PER-LABEL METRICS (synthetic hold-out, n={len(result['test_texts'])})")
    print("=" * 70)
    print(
        classification_report(
            result["y_test"],
            result["y_pred"],
            target_names=ALL_LABELS,
            zero_division=0,
        )
    )
    print(
        f"Micro-F1: {result['micro_f1']:.3f}   "
        f"Macro-F1: {result['macro_f1']:.3f}"
    )
    print("NOTE: synthetic hold-out metrics are not field-performance estimates.")

    print()
    print("=" * 70)
    print("SAMPLE PREDICTIONS")
    print("=" * 70)
    for index in range(min(8, len(result["test_texts"]))):
        true_labels = [
            ALL_LABELS[j] for j, value in enumerate(result["y_test"][index]) if value
        ]
        pred_labels = [
            ALL_LABELS[j] for j, value in enumerate(result["y_pred"][index]) if value
        ]
        match = "OK" if set(true_labels) == set(pred_labels) else "DIFF"
        print(f"[{match}] {result['test_texts'][index]}")
        print(f"       true: {true_labels}")
        print(f"       pred: {pred_labels}")
        print()


if __name__ == "__main__":
    main()
