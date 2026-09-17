"""Automated tests for preprocessing, training, and inference."""
import sys
from pathlib import Path

import pytest

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from generate_dataset import write_dataset
from preprocess import clean_text
from train import ALL_LABELS, train_model


@pytest.fixture(scope="session", autouse=True)
def build_reproducible_model():
    """Build fresh deterministic artifacts so a clean clone can run the tests."""
    write_dataset()
    train_model()


def _predict(text):
    from predict import predict_food_groups
    return predict_food_groups(text)


def test_clean_text_removes_stopwords_keeps_food_names():
    cleaned = clean_text("She ate a boiled egg and some rice today.")
    assert "boiled" in cleaned and "egg" in cleaned and "rice" in cleaned
    assert "she" not in cleaned and "today" not in cleaned


def test_clean_text_preserves_multiword_local_food_names():
    cleaned = clean_text("She had tuo zaafi and zogale leaves.")
    assert "tuo" in cleaned and "zaafi" in cleaned
    assert "zogale" in cleaned and "leaves" in cleaned


def test_clean_text_normalizes_breast_milk_variant():
    assert "breastmilk" in clean_text("The infant took breast milk.")
    assert "breast milk" not in clean_text("The infant took breast milk.")


def test_predict_returns_valid_shape():
    result = _predict("She ate rice and chicken today.")
    assert "food_groups" in result
    assert isinstance(result["food_groups"], list)
    assert all(group in ALL_LABELS for group in result["food_groups"])


def test_predict_single_clear_food_grains():
    assert "grains" in _predict("She ate rice today.")["food_groups"]


def test_predict_single_clear_food_eggs():
    assert "eggs" in _predict("He had a boiled egg this morning.")["food_groups"]


def test_predict_breastfeeding_only():
    result = _predict("The baby is still exclusively breastfeeding, nothing else today.")
    assert result["food_groups"] == ["breastmilk"]


def test_predict_breast_milk_two_token_variant():
    result = _predict("The infant took only breast milk this morning.")
    assert result["food_groups"] == ["breastmilk"]


def test_predict_empty_text_returns_empty_list():
    assert _predict("")["food_groups"] == []


def test_predict_flesh_and_vitamin_a_combo():
    groups = _predict("He had zogale leaves and dried fish today.")["food_groups"]
    assert "flesh" in groups
    assert "vit_a" in groups


def test_main_readme_example_catches_core_groups():
    groups = _predict(
        "She ate tuo zaafi with groundnut soup and a boiled egg for breakfast, and rice in the evening."
    )["food_groups"]
    assert "grains" in groups
    assert "eggs" in groups
