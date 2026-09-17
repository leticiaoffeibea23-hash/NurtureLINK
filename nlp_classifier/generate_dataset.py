"""Generate synthetic labelled data for the dietary-recall classifier.

The examples are template-generated from an explicit food-to-IYCF-group lookup
rather than scraped or LLM-labelled. This makes the labels reproducible and
auditable, but the resulting dataset is synthetic and must not be treated as a
substitute for field-labelled CHO dietary-recall data.
"""
import csv
import random
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_PATH = DATA_DIR / "training_data.csv"

FOOD_TO_GROUP = {
    "tuo zaafi": "grains", "tz": "grains", "banku": "grains", "fufu": "grains",
    "kenkey": "grains", "waakye": "grains", "jollof rice": "grains", "rice": "grains",
    "boiled yam": "grains", "yam": "grains", "cassava": "grains", "maize porridge": "grains",
    "koko": "grains", "millet porridge": "grains", "gari": "grains", "sweet potato": "grains",
    "bread": "grains", "porridge": "grains",
    "groundnut soup": "legumes_nuts", "groundnuts": "legumes_nuts", "cowpea": "legumes_nuts",
    "tuya": "legumes_nuts", "beans": "legumes_nuts", "soybean": "legumes_nuts",
    "bambara beans": "legumes_nuts", "red-red": "legumes_nuts", "kose": "legumes_nuts",
    "peanut paste": "legumes_nuts", "lentils": "legumes_nuts",
    "milk": "dairy", "yogurt": "dairy", "cheese": "dairy", "powdered milk": "dairy",
    "koose with milk": "dairy", "milo with milk": "dairy",
    "dried fish": "flesh", "amani": "flesh", "smoked fish": "flesh", "tilapia": "flesh",
    "chicken": "flesh", "guinea fowl": "flesh", "goat meat": "flesh", "beef": "flesh",
    "liver": "flesh", "kidney": "flesh", "snails": "flesh", "grasscutter": "flesh",
    "sardines": "flesh", "crab": "flesh", "shrimp": "flesh",
    "boiled egg": "eggs", "fried egg": "eggs", "egg": "eggs", "omelette": "eggs",
    "scrambled egg": "eggs",
    "zogale leaves": "vit_a", "zogale": "vit_a", "moringa leaves": "vit_a",
    "pumpkin": "vit_a", "carrot": "vit_a", "mango": "vit_a", "ripe pawpaw": "vit_a",
    "pawpaw": "vit_a", "red palm oil": "vit_a", "kontomire": "vit_a", "spinach": "vit_a",
    "sweet pepper": "vit_a",
    "tomato": "other_fv", "onion": "other_fv", "cabbage": "other_fv", "orange": "other_fv",
    "banana": "other_fv", "garden eggs": "other_fv", "okra": "other_fv", "cucumber": "other_fv",
    "watermelon": "other_fv", "pineapple": "other_fv", "green pepper": "other_fv",
    "breastmilk": "breastmilk", "breast milk": "breastmilk",
}

TEMPLATES_SINGLE = [
    "She ate {a} today.",
    "The child had {a} this morning.",
    "For breakfast she took {a}.",
    "He was given {a} at lunch.",
    "This morning the baby only had {a}.",
    "She only ate {a} yesterday.",
]

TEMPLATES_MULTI = [
    "She ate {a} with {b} for breakfast, and {c} in the evening.",
    "This morning she had {a} and {b}, then {c} at night.",
    "The child ate {a} with {b} at lunch, and later some {c}.",
    "For breakfast, {a} and {b}. In the evening, {c}.",
    "She took {a} in the morning, {b} at noon, and {c} before bed.",
    "He had {a} and {b} today, plus {c} in the afternoon.",
    "Today she ate {a}, {b}, and {c}.",
]

TEMPLATES_TWO = [
    "She had {a} and {b} today.",
    "This morning the child ate {a} with {b}.",
    "For dinner she took {a} and some {b}.",
]

BREASTFEEDING_ONLY = [
    "The baby is still exclusively breastfeeding, nothing else today.",
    "She only breastfed today, no other food given yet.",
    "The infant took only breastmilk this morning.",
    "He is still fully on breast milk, no solids introduced.",
]


def food_groups_for(*foods):
    return sorted({FOOD_TO_GROUP[food] for food in foods})


def make_rows(seed: int = 42):
    rng = random.Random(seed)
    rows = []
    foods = list(FOOD_TO_GROUP.keys())

    for food in foods:
        for template in rng.sample(TEMPLATES_SINGLE, 2):
            rows.append((template.format(a=food), food_groups_for(food)))

    for _ in range(140):
        a, b = rng.sample(foods, 2)
        rows.append((rng.choice(TEMPLATES_TWO).format(a=a, b=b), food_groups_for(a, b)))

    for _ in range(220):
        a, b, c = rng.sample(foods, 3)
        rows.append((rng.choice(TEMPLATES_MULTI).format(a=a, b=b, c=c), food_groups_for(a, b, c)))

    for text in BREASTFEEDING_ONLY:
        rows.append((text, ["breastmilk"]))

    for _ in range(15):
        a, b = rng.sample(foods, 2)
        text = f"She had {a} and {b} today, and is still breastfeeding too."
        rows.append((text, food_groups_for(a, b, "breastmilk")))

    rng.shuffle(rows)
    return rows


def write_dataset(path: Path = DATA_PATH, seed: int = 42):
    rows = make_rows(seed=seed)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["text", "food_groups"])
        for text, groups in rows:
            writer.writerow([text, "|".join(groups)])
    return rows


if __name__ == "__main__":
    generated = write_dataset()
    print(f"Wrote {len(generated)} synthetic labelled examples to {DATA_PATH}")
    counts = Counter(label for _, labels in generated for label in labels)
    for label, count in sorted(counts.items()):
        print(f"  {label}: {count}")
