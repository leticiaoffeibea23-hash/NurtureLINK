# NurtureLink — Application draft

*AI for Nurturing Care Hackathon · UNICEF StartUp Lab (KOICA / MEST). Working draft. Bracketed items need your input; the field-grounding section needs at least one real conversation with a CHO or nutrition officer before you submit.*

---

## 1. Team profile

The build team can be any size; only up to three members attend the bootcamp if selected, so list your three bootcamp members first.

| | Name | Role | Based in | Background | Key skills |
|---|---|---|---|---|---|
| 1 | Yakubu Lute | Technical lead | Techiman, Bono East | Senior software engineer, founder of Lute Technologies; built AgroLink (agri marketplace with food, seasonality and price data) | Mobile (React Native/Expo), offline-first architecture, AI integration |
| 2 | [Name] | Health / nutrition domain | [Northern Region] | [e.g. nutrition officer, public-health, or UDS graduate with TTFPP field experience] | Maternal and child nutrition, community context |
| 3 | [Name] | Design / community | [town] | [design + community insight] | UX, local-language content, field research |

Required mix confirmed: at least one female member [confirm], a blend of technology plus maternal, newborn, child health or nutrition insight, and ideally one member with UDS / TTFPP field experience (encouraged, not mandatory per the info session). Recruit the missing roles via the hackathon WhatsApp group and teammate form shared in the session.

---

## 2. Problem statement and target user

**Target user:** a CHPS Community Health Officer or nutrition officer in a Northern Region district, working across scattered rural households, often offline, carrying a smartphone.

**The problem.** In Northern Ghana, maternal and child undernutrition is severe and worsening. The Northern Region reported 100 institutional maternal deaths in 2023 against 69 in 2022, a ratio of 136.7 per 100,000 live births, above the national target of 125 (Northern Regional Health Directorate, 2023 performance review). Among children 6 to 23 months in northern Ghana, roughly a third are stunted and fewer than four in ten receive a minimum acceptable diet (peer-reviewed northern-Ghana studies). Diet quality is the lever: children eating fewer than four food groups are nearly four times as likely to be wasted.

Yet the health worker has no tool for the two things that would move this. First, between visits there is no record of how a mother's or child's nutrition is actually trending; the worker sees only a weight and a haemoglobin reading at each visit, so counselling stays generic. Second, when the worker does counsel, they cannot quickly tell a caregiver *which specific foods to eat this week that are both nutritious and actually available and affordable in their locality this season.* Generic advice ("eat well, eat greens") ignores that the right foods change by season and that these are poor households who cannot act on a list of foods they cannot find or afford. (This framing follows guidance given directly by a Ghana Health Service public-health director at the info session, who cautioned that tracking individual food *prices* is not useful; seasonal availability and affordability are.)

**Narrow problem we will solve:** give the frontline worker (a) a simple longitudinal picture of each client's nutrition across visits, and (b) a specific, seasonally-available, affordable, nutrient-adequate feeding plan they can hand to the caregiver as a local-language voice note.

**Measurable benefit:** the share of counselled caregivers who can assemble a minimum acceptable diet within their means, and improvement in each child's diet-diversity score across visits.

---

## 3. Solution concept — how the AI is used, safely and practically

**NurtureLink** is an offline-first mobile app for the health worker, with a local-language voice layer for the caregiver. It does two things and deliberately no more.

**A. Longitudinal nutrition record.** Built entirely from what the worker already collects at each visit (weight, haemoglobin or MUAC, and a short dietary recall), the app shows each client's trend over time and flags falling haemoglobin, flattening weight, or low diet diversity, so the worker can prioritise who to counsel and tailor the message. Nothing new to measure.

**B. Seasonal affordable-food plan.** For a flagged client, the app produces a feeding plan built from foods that are in season, affordable and locally available in that district this month, chosen to close the specific nutrient gap (iron and folate for an anaemic mother; energy, protein and diet diversity for a faltering child). The plan is delivered as a plain-language voice note in the local language that the caregiver keeps on any phone.

**Where AI genuinely earns its place (not AI for its own sake):**
- Prioritisation from each client's own visit history (an explainable risk flag, not a black box).
- Constrained recommendation: selecting a nutrient-adequate basket from the set of in-season, affordable local foods, closing the missing food groups at lowest burden to the family.
- Generation of a simple, local-language counselling script from the selected plan.

**Responsible-AI design (their explicit criterion):**
- The AI supports the worker's decision and never replaces it; the worker remains responsible for care.
- Every recommendation carries a plain-language "why," with no jargon.
- Severe cases (severe acute malnutrition, severe anaemia, obstetric danger signs) bypass nutrition advice entirely and route to referral.
- Recommendations align to WHO growth standards, WHO anaemia thresholds and GHS/CHPS protocol.
- Client data stays on the device, with the worker in control, and syncs to district systems (DHIMS2-compatible) only when a connection is available.

**Practical for the field:** works fully offline and syncs in the background; no dependence on live market-price feeds; the caregiver channel needs no smartphone or data, only a voice note the worker plays or sends.

---

## 4. Prototype scope

**Demonstrable now (in the repo):** a clickable mobile prototype showing the full flow — a prioritised nutrition follow-up list, a client's nutrition trend across visits, the seasonal affordable-food plan with nutrient adequacy and an explainable rationale, a local-language voice-note step, and the severe-case referral guardrail. It runs offline in any browser with no backend.

**To be built at the bootcamp (the MVP):**
- A real seasonal food-availability and affordability dataset for one pilot district, replacing the demo data.
- A real nutrient-adequacy calculation against WHO/IYCF targets using a West African food-composition table.
- On-device storage with background sync and a DHIMS2-compatible export.
- One recorded local-language (Dagbani) voice pack for the caregiver plan.

Scoping to a single district and a single language for the MVP is deliberate: a smaller solution that works reliably beats a broad one that fails in the field.

---

## 5. Repository

GitHub: [repo URL]. Contains the working prototype source and a short README describing the concept, the two core functions, the offline and responsible-AI design, and the bootcamp build plan. [Confirm the repo is public and the README is current before submitting.]

---

## Field grounding and responsible-AI note (do not skip)

The UNICEF advisor closing the session warned specifically against submissions that read as "fully AI, not really practical," and urged applicants to do their own research first. Address this head-on:

- **Primary grounding:** the problem statement rests on Ghana-specific data — the Northern Regional Health Directorate's 2023 review, and peer-reviewed northern-Ghana nutrition studies (stunting ~33%, minimum acceptable diet <40%, the food-group / wasting association). The seasonal-food framing follows guidance given directly by a GHS public-health director in the session.
- **Do before submitting:** have at least one real conversation with a CHPS nutrition officer or CHO about how they currently counsel on diet and what would actually help. Note it in the application. Even one field voice changes how this reads.
- **Honest AI use:** tools were used to accelerate structuring and prototyping; the concept is grounded in field data and expert input, and the team owns the thinking. Keep it that way through the bootcamp.

### Sources to cite
- Northern Regional Health Directorate, 2023 annual health performance review (via Ghana News Agency, Mar 2024): 100 institutional maternal deaths in 2023 vs 69 in 2022; ratio 136.7 per 100,000.
- Peer-reviewed northern-Ghana IYCF studies (BMC / NCBI): stunting ~33% among 6–23 months; minimum acceptable diet ~38.9%; children eating <4 food groups ~4x more likely to be wasted.
- GDHS 2022 (national): minimum acceptable diet 26.4% among 6–23 months; national maternal mortality context and SDG 3.1 target (<70 per 100,000 by 2030).
- UNICEF Ghana reports and the StartUp Lab concept note (UNICEF / UNICEF StartUp Lab LinkedIn) — read before finalising.

### Timeline
Applications close **11 August**. Virtual pre-workshops through August (attend if you can; not mandatory). Bootcamp **26–28 August, Tamale** (top 10 teams; fully sponsored — accommodation, feeding, transport stipend): day 1 shape the idea, day 2 build the MVP, day 3 pitch. Around ten awards, not winner-take-all. Teams own their IP.
