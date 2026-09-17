"""Train the experimental dietary-recall multi-label classifier.

Pipeline: cleaned text -> TF-IDF word uni/bi-grams -> one-vs-rest logistic
regression. The model is intentionally simple and auditable for a small pilot
dataset. It is a research prototype for the NLP parsing sub-task only; it does
not replace NurtureLink's deterministic clinical decision engine.
"""
import csv
import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

from preprocess import clean_text

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "training_data.csv"
MODEL_DIR = BASE_DIR / "model"

ALL_LABELS = [
    "grains", "legumes_nuts", "dairy", "flesh",
    "eggs", "vit_a", "other_fv", "breastmilk",
]


def load_data(path: Path = DATA_PATH):
    if not path.exists():
        raise FileNotFoundError(
            f"Training data not found at {path}. Run `python generate_dataset.py` first."
        )

    texts, label_lists = [], []
    with path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            texts.append(row["text"])
            label_lists.append(row["food_groups"].split("|"))
    return texts, label_lists


def train_model(data_path: Path = DATA_PATH, model_dir: Path = MODEL_DIR):
    texts, label_lists = load_data(data_path)
    cleaned = [clean_text(text) for text in texts]

    mlb = MultiLabelBinarizer(classes=ALL_LABELS)
    labels = mlb.fit_transform(label_lists)

    x_train_text, x_test_text, y_train, y_test, raw_train, raw_test = train_test_split(
        cleaned,
        labels,
        texts,
        test_size=0.20,
        random_state=42,
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    x_train = vectorizer.fit_transform(x_train_text)

    classifier = OneVsRestClassifier(
        LogisticRegression(max_iter=1000, C=5.0, random_state=42)
    )
    classifier.fit(x_train, y_train)

    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, model_dir / "vectorizer.joblib")
    joblib.dump(classifier, model_dir / "classifier.joblib")
    joblib.dump(mlb, model_dir / "label_binarizer.joblib")

    with (model_dir / "test_split.json").open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "test_texts": list(raw_test),
                "test_labels": y_test.tolist(),
            },
            handle,
            indent=2,
        )

    return {
        "n_train": len(raw_train),
        "n_test": len(raw_test),
        "vocabulary_size": len(vectorizer.vocabulary_),
    }


def main():
    metadata = train_model()
    print(
        f"Trained on {metadata['n_train']} examples; "
        f"held out {metadata['n_test']} synthetic examples for evaluation."
    )
    print(f"Vocabulary size: {metadata['vocabulary_size']}")
    print(f"Model artifacts written to {MODEL_DIR}")


if __name__ == "__main__":
    main()
