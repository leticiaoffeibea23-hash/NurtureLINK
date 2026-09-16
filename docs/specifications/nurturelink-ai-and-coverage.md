# NurtureLink — AI Integration & Challenge Coverage (spec addendum)

*Companion to the NurtureLink Technical & Product Specification. Answers two questions: how the product maps to UNICEF's six challenge areas, and how AI is concretely integrated into the app's flows.*

---

## Part A — Coverage of UNICEF's six challenge areas

The hackathon guidance was explicit: choose a narrow problem, design for a real user, demonstrate a measurable benefit, and a smaller reliable solution beats a broad fragile one. NurtureLink therefore goes deep on one area and is honest about what it touches and what it defers.

| # | Challenge area | Their question | NurtureLink | Depth |
|---|---|---|---|---|
| 1 | Predicting risk before crisis | Who needs attention first? | Prioritised follow-up list ranked from each client's own visit trend (falling Hb, flat weight-for-age, low diet diversity, danger signs) | **Touched (solid)** |
| 2 | Last-mile follow-up | Who was referred but did not reach care? | Severe cases route to a referral guardrail, but tracking whether the client reached care is out of MVP scope | **Deferred (roadmap)** |
| 3 | Local-food nutrition intelligence | What can this household afford and access? | Core product: seasonal, affordable, locally-available feeding plan matched to the client's nutrient gap, plus a longitudinal nutrition record | **Core (deep)** |
| 4 | Voice-first caregiver support | How can guidance work without reading or typing? | Plan delivered as a local-language voice note the caregiver keeps on any phone | **Core (channel)** |
| 5 | Smarter CHPS workflows | How can staff record and plan efficiently? | Offline visit capture from data already collected, auto-computed trends and flags, DHIMS2-compatible export | **Touched (solid)** |
| 6 | Hidden barriers to care | What is stopping this family? | Partially: the plan reasons about the affordability and access barrier to good nutrition (for example, "daily market trip was the barrier"); it does not systematically surface care-seeking barriers such as stigma, transport, or family dynamics | **Lightly touched** |

### How to pitch this
Lead with challenge 3 as your one deep problem, name 4 as the delivery channel, and note that 1 and 5 come along naturally because the same visit data drives prioritisation and workflow. Then state plainly that last-mile tracking (2) and the wider care-seeking barriers (6) are deliberately on the roadmap, not the MVP. That sentence signals engineering discipline and matches exactly what they said they reward. Do not claim all six; claiming breadth is the failure mode they warned about.

---

## Part B — AI integration architecture

### B.1 The governing principle: two layers, kept apart

The single most important design decision is to separate the **deterministic clinical core** from the **AI enrichment layer**.

- **Clinical core (deterministic, on-device, always available, auditable):** prioritisation flags, food selection, nutrient adequacy, and the severe-case guardrails. These are rules against WHO/IYCF/GHS references. No AI decides clinical content. This is what keeps the product safe, explainable, and offline-capable.
- **AI enrichment layer (probabilistic, server-side, connectivity-dependent, optional, cached):** turning fixed plan facts into natural local-language phrasing, parsing free-text or spoken dietary recall into food groups, and later, ranking and summarisation. AI never sits in the decision path; it formats, parses, and ranks around a fixed clinical result.

```
             CLINICAL CORE (device, deterministic)            AI ENRICHMENT (server, optional)
  visit data ─► flags/prioritisation ─┐
                                       ├─► PLAN (fixed foods + fixed clinical facts)
  reference bundle ─► food selection ─┘            │
                                                   ├─(online)─► LLM: rephrase facts into
                                                   │            warm local-language script ─► cache to device
                                                   │
  free-text recall ─(online)─► LLM: parse ─► food groups ─► back into diet-diversity score
                    └─(offline)─► manual food-group tap-select (fallback)
```

If the AI layer is unreachable, every core function still works and the caregiver still gets a plan via the templated fallback. AI improves the experience; it is never a dependency for care.

### B.2 The AI flows, concretely

**Flow 1 — Counselling script generation (MVP-plus, the primary AI feature)**
- **Purpose:** turn a deterministic plan (a fixed list of foods and fixed clinical facts) into a warm, plain, culturally appropriate caregiver script, ready for voice.
- **Trigger:** when a plan is generated and the device is online (or during a background sync).
- **Where it runs:** backend proxies to the LLM API. Keys never touch the device.
- **Input:** structured plan JSON (client type, selected foods with local names, target nutrients, the deterministic rationale, language).
- **Output:** a short script string, validated, then cached to the device with the plan and matched to pre-recorded audio phrases or sent to TTS.
- **Offline behaviour:** if offline at plan time, use the templated script (fixed sentence patterns filled from the plan). The LLM version replaces it on the next sync.
- **Guardrail:** the prompt passes only the fixed facts and instructs the model to rephrase and translate, never to add or change any food, quantity, or clinical claim. Output is validated (see B.4) before use.

**Flow 2 — Dietary-recall parsing (Could-have)**
- **Purpose:** let the worker or caregiver describe what was eaten in free text or speech, and convert it into the structured food groups the diversity score needs.
- **Where/when:** server-side, online; feeds the clinical core's diversity input.
- **Offline fallback:** manual food-group tap-select (the default capture method; parsing is a convenience on top).
- **Guardrail:** the parsed result is shown to the worker to confirm before it counts.

**Flow 3 — Voice (ASR/TTS) — roadmap, not MVP**
- Local-language speech-to-text and text-to-speech for Ghanaian languages are unreliable today, so MVP uses pre-recorded human voice and manual capture. Revisit when a service supports the target language well enough for a clinical message.

**Flow 4 — Learned risk ranking — roadmap**
- Once enough visit data exists, a lightweight model (for example gradient-boosted trees or logistic regression) can rank the follow-up list. It runs as a ranking aid *over* the transparent rules, on-device, and never becomes an opaque clinical gate. The rule-based flags remain the source of truth.

**Flow 5 — Supervisor caseload summarisation — roadmap**
- Server-side LLM summary of a facility's nutrition caseload for a district supervisor. Read-only, aggregate, no effect on care.

### B.3 Model, API, and runtime choices
- **Model:** an LLM accessed via API. Claude is the natural fit given quality on short structured tasks and your existing familiarity. Use a small, fast tier (for example Claude Haiku) for script generation and recall parsing, since these are short, well-constrained jobs; step up to a larger tier only if quality demands. Confirm the current model names and pricing at docs.claude.com before wiring.
- **Server-side only:** the backend calls the LLM. This keeps API keys off the device, lets you cache and batch, bounds cost, and gives you one place to log and validate outputs.
- **Structured I/O:** send structured JSON, instruct the model to return only JSON (no prose, no code fences), and parse defensively.
- **Caching:** cache generated scripts by plan signature (client profile plus food set plus language plus reference-bundle version) so identical plans are generated once, not per visit.

### B.4 Prompt design and grounding (the safety core of the integration)
- **Ground, do not generate:** the prompt supplies the fixed plan facts and constrains the model to rephrasing and translating them. The model must not introduce any food, quantity, nutrient claim, or medical instruction not present in the input.
- **Validate the output:** before use, check that the script references only foods present in the plan and contains no numeric or clinical claims beyond the inputs. On any drift, discard and fall back to the template. This validation is cheap and non-negotiable in a health context.
- **Localisation:** translation quality for local languages should be reviewed by a native-speaking health worker during setup; the pre-recorded audio path (not raw TTS) is the safe default for the caregiver message.

### B.5 Responsible-AI controls (their explicit judging criterion)
- Every AI output is logged with its input and the model/version, for audit.
- A human worker reviews every plan and script before it reaches a caregiver.
- The clinical decision path contains no AI; AI only formats, parses, and ranks.
- Outputs are validated against the deterministic plan; failures degrade to templates.
- No client identifiers are sent to the LLM beyond what the task needs (send the plan facts, not the person's identity).

### B.6 Cost and reliability posture
- Cost is bounded: short prompts, a small model tier, caching by plan signature, and generation only when online. A field device never blocks on, or pays per, an AI call during a visit.
- Reliability: the templated fallback means an LLM outage or a bad connection degrades quality, not function.

### B.7 Worked example (Flow 1)

*Deterministic plan produced by the clinical core (input to the LLM):*
```json
{
  "client": { "type": "pregnant", "gestation_weeks": 30 },
  "language": "dagbani",
  "target_nutrients": ["iron", "folate"],
  "foods": [
    { "name": "zogale leaves", "local": "zogale", "why": "in season, iron+folate" },
    { "name": "dried small fish", "local": "amani", "why": "storable, iron+protein" },
    { "name": "cowpea", "local": "tuya", "why": "storable, protein+folate" }
  ],
  "clinical_note": "reinforce daily iron-folate supplement"
}
```

*Instruction to the model (essence):* rephrase only these facts into a short, warm caregiver message in the target language; do not add foods, amounts, or medical advice not listed; return JSON `{ "script": "..." }`.

*Output, after validation, cached and matched to audio:* a two or three sentence spoken plan that names only zogale, amani, and tuya and repeats the supplement reminder, and nothing else.

---

## Suggested integration into the main spec
Fold Part A into section 3 (scope) as a coverage table, and Part B into section 11 (replacing the shorter AI posture with these flows). I can merge it on request.
