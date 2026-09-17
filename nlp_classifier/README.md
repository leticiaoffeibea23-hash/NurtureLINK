# Experimental Dietary Recall NLP Classifier

A small, reproducible **multi-label NLP prototype** for NurtureLink. It maps a caregiver's free-text dietary recall to the eight IYCF food-group labels used by the project.

> **Status:** experimental research extension, added in September 2026. It was not part of the original hackathon MVP and is not yet integrated into the React Native application.

This module was developed by **Leticia Offeibea** to explore whether a lightweight, interpretable text-classification pipeline could support NurtureLink's dietary-recall parsing workflow without relying on an external LLM for every classification.

## Example

Input:

```text
She ate tuo zaafi with groundnut soup and a boiled egg for breakfast, and rice in the evening.
```

Target output shape:

```json
{
  "food_groups": ["grains", "legumes_nuts", "eggs"]
}
```

The classifier handles a **multi-label** problem because one recall sentence can mention foods from several food groups.

## What this demonstrates

The module contains a complete classical-ML/NLP workflow rather than only an inference script:

```text
generate_dataset.py
        ↓
preprocess.py
        ↓
TF-IDF word uni/bi-grams
        ↓
One-vs-Rest Logistic Regression
        ↓
evaluate.py / predict.py
        ↓
pytest checks
```

| Stage | Implementation |
| --- | --- |
| Labelled data | Deterministic template generator + explicit food-to-group mapping |
| Preprocessing | Lowercasing, small stopword list, breastfeeding normalization; no English stemming of local food names |
| Features | TF-IDF word 1–2 grams |
| Model | `OneVsRestClassifier(LogisticRegression)` |
| Task | Eight-label multi-label classification |
| Evaluation | Saved 20% synthetic hold-out split + per-label precision/recall/F1 |
| Testing | Reproducible training + preprocessing/inference tests with `pytest` |

The model is deliberately simple. With a small pilot dataset and a fixed label set, linear TF-IDF features are easier to inspect and debug than a deep model and provide a useful baseline for later field-labelled data.

## Data

`generate_dataset.py` creates **539 synthetic labelled examples** from:

- a hand-written food-to-group mapping that includes local foods such as `tuo zaafi`, `zogale`, `amani`, and `groundnut soup`;
- single-food, two-food, and three-food recall templates;
- breastfeeding-only and mixed-feeding examples.

The generator uses a fixed seed, so the dataset is reproducible. Generated data and trained model artifacts are intentionally not committed; they can be recreated from source.

### Important limitation

The examples are **synthetic**. They are useful for testing the code path and establishing a baseline, but they are not a substitute for labelled dietary-recall text collected from Community Health Officers or caregivers. Metrics below therefore **must not be interpreted as real-world clinical performance**.

## Reproducible results

On the deterministic 20% synthetic hold-out split (`108` examples):

```text
Micro-F1: 0.938
Macro-F1: 0.929
```

Selected per-label F1 scores from the same synthetic hold-out:

| Label | F1 |
| --- | ---: |
| grains | 0.93 |
| legumes_nuts | 0.91 |
| dairy | 0.95 |
| flesh | 0.95 |
| eggs | 0.83 |
| vit_a | 0.94 |
| other_fv | 0.97 |
| breastmilk | 0.95 |

These numbers measure generalization to held-out **template-generated sentences from the same synthetic data-generating process**. They do not estimate performance on field text, spelling variation, code-switching, transcription errors, or unseen foods.

## Run it

From this directory:

```bash
python -m pip install -r requirements.txt
python generate_dataset.py
python train.py
python evaluate.py
python -m pytest test_classifier.py -v
```

A clean run currently produces:

```text
539 synthetic labelled examples
431 training examples
108 held-out synthetic examples
11 tests passed
```

For inference after training:

```python
from predict import predict_food_groups

result = predict_food_groups("She ate rice and chicken today.")
print(result)
# {'food_groups': ['grains', 'flesh']}
```

`predict_with_confidence()` also exposes per-label logistic probabilities for analysis and future threshold tuning.

## Relationship to NurtureLink

NurtureLink already describes a dietary-recall parsing flow that converts free text into food groups. This module explores a local classical-ML alternative for that narrow parsing task.

It **does not** replace the deterministic recommendation engine and does not make referral or clinical decisions. Its output would only be a candidate structured representation of dietary recall, which should remain reviewable by the health worker.

### Deployment status

The current artifact is Python/scikit-learn. It **cannot be dropped directly into the React Native app**. A true on-device deployment would require a compatible mobile inference runtime or model conversion, plus testing of numerical parity, memory use, latency, and failure behavior. Until that work and field validation are complete, NurtureLink's existing manual food-group selection remains the reliable offline fallback.

## Limitations and next steps

1. **Collect field-labelled recall text.** Evaluate on CHO-entered or caregiver-transcribed sentences instead of only synthetic templates.
2. **Expand language coverage.** Add spelling variants, code-switching, local-language phrasing, and speech-to-text noise.
3. **Evaluate unseen-food generalization.** The current random split can contain the same food vocabulary in training and test examples.
4. **Tune thresholds per label.** Multi-label classes have different prevalence and error costs; a single default threshold may not be optimal.
5. **Add human verification.** False negatives can omit a consumed food group, so predictions should be confirmed rather than silently accepted.
6. **Prototype mobile deployment only after validation.** Conversion/runtime work should follow, not precede, evidence that the classifier is useful on real field text.

## Files

- `generate_dataset.py` — deterministic synthetic-data generator and food-group mapping
- `preprocess.py` — auditable text normalization
- `train.py` — TF-IDF + one-vs-rest logistic-regression training pipeline
- `evaluate.py` — per-label and aggregate synthetic hold-out evaluation
- `predict.py` — inference wrapper and confidence output
- `test_classifier.py` — reproducibility, preprocessing, and inference tests
- `requirements.txt` — Python dependencies
