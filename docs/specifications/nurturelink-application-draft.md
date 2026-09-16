# NurtureLink — Application Draft

*AI for Nurturing Care Hackathon · UNICEF StartUp Lab (KOICA / MEST).*

---

## 1. Team profile

| # | Name | Role | Based in | Background | Key skills |
| --- | --- | --- | --- | --- | --- |
| 1 | Yakubu Lute | Technical lead | Kumasi / Accra, Ghana | Senior Full-Stack Engineer at Amalitech; Frontend Lead at mPedigree Network (health-tech, pharmaceutical verification); 7+ years production software (mobile, web, backend); born Tumu, Upper West Region | React Native/Expo, offline-first architecture, AI integration, TypeScript, WCAG 2.1 |
| 2 | Leticia Offeibea | Health & nutrition domain | Ghana | BSc Health Information Management; Research Assistant on Social Determinants of Health; USAID Ghana National Malaria Elimination Programme field experience at community level | Health information systems, IYCF clinical thresholds, community health programme operations, population health analytics |

**UNICEF criteria:**

- Female member: Leticia Offeibea
- Technology expertise: Yakubu Lute — 7+ years full-stack, mobile, AI
- Health/nutrition domain: Leticia Offeibea — HIM degree, USAID Ghana community health field work
- Connection to problem geography: Yakubu born in Upper West Region (named in problem statement); Leticia — Ghana community health programme experience
- Responsible AI: both — architecture enforces clinical guardrails; LLM never makes clinical decisions

---

## 2. Problem statement and target user

**Target user:** a CHPS Community Health Officer or nutrition officer in a Northern Region district, working across scattered rural households, often offline, carrying a smartphone.

**The problem.** In Northern Ghana, maternal and child undernutrition is severe and worsening. The Northern Region reported 100 institutional maternal deaths in 2023 against 69 in 2022, a ratio of 136.7 per 100,000 live births, above the national target of 125 (Northern Regional Health Directorate, 2023 performance review). In Savannah Region, 91.8 percent of neonatal deaths occurred in the first seven days of life (DHIMS-2, 2018–2022) — a window so tight that any intervention arriving at the six-week postnatal visit is already five weeks too late. Among children 6 to 23 months in northern Ghana, roughly a third are stunted and fewer than four in ten receive a minimum acceptable diet (GDHS 2022: 26.4% nationally). Diet quality is the lever: children eating fewer than four food groups are nearly four times as likely to be wasted. Food insecurity in Upper East Region stands at 73.7 percent — the highest of the five northern regions (GDHS 2022).

Yet the health worker has no tool for the two things that would move this. First, between visits there is no record of how a mother's or child's nutrition is actually trending; the worker sees only a weight and a haemoglobin reading at each visit, so counselling stays generic. Second, when the worker does counsel, they cannot quickly tell a caregiver *which specific foods to eat this week that are both nutritious and actually available and affordable in their locality this season.* Generic advice ("eat well, eat greens") ignores that the right foods change by season and that these are poor households who cannot act on a list of foods they cannot find or afford. (This framing follows guidance given directly by a Ghana Health Service public-health director at the info session, who cautioned that tracking individual food *prices* is not useful; seasonal availability and affordability are.)

**Narrow problem we will solve:** give the frontline worker (a) a simple longitudinal picture of each client's nutrition across visits, and (b) a specific, seasonally-available, affordable, nutrient-adequate feeding plan they can hand to the caregiver as a local-language voice note.

**Measurable benefit:** the share of counselled caregivers who can assemble a minimum acceptable diet within their means, and improvement in each child's diet-diversity score across visits.

---

## 3. Solution concept — how the AI is used, safely and practically

**NurtureLink** is an offline-first mobile app for the health worker, with a local-language voice layer for the caregiver. It does two things and deliberately no more.

**Two very different users, one solution connecting them.** The CHO (primary user) is trained, time-poor, and carries a register of 10–25 households. The caregiver (secondary user) may not be literate, may not own a phone, and may not be the household member who decides whether to seek care. The CHO interface is a fast clinical tool built for one-handed use in a household doorway. The caregiver receives no app and no screen — only a voice note in her own language that plays on any phone the CHO holds up. These are deliberate, different design choices for two people with completely different contexts.

**A. Longitudinal nutrition record.** Built entirely from what the worker already collects at each visit (weight, haemoglobin or MUAC, and a short dietary recall), the app shows each client's trend over time and flags falling haemoglobin, flattening weight, or low diet diversity, so the worker can prioritise who to counsel and tailor the message. Nothing new to measure.

**B. Seasonal affordable-food plan.** For a flagged client, the app produces a feeding plan built from foods that are in season, affordable and locally available in that district this month, chosen to close the specific nutrient gap (iron and folate for an anaemic mother; energy, protein and diet diversity for a faltering child). The plan is delivered as a plain-language voice note in the local language that the caregiver keeps on any phone.

**Where AI genuinely earns its place (not AI for its own sake):**
- Prioritisation from each client's own visit history (an explainable risk flag, not a black box).
- Constrained recommendation: a paper checklist can tell a CHO to recommend protein and iron-rich foods. It cannot determine, from the current month and the client's specific nutrient gap, which of those foods are actually abundant in their agro-zone today, affordable on a household budget, and together sufficient to close the identified gap. That is a combinatorial constraint-satisfaction problem the engine solves on-device in under one second.
- Generation of a simple, local-language counselling script from the selected plan — turning clinical facts into words a caregiver can understand and act on.

**Responsible-AI design (their explicit criterion):**
- The CHO always makes the final decision. The app surfaces evidence and a suggested plan; the worker confirms, adjusts, or overrides before the caregiver hears anything.
- Every recommendation carries a plain-language "why" — which nutrient gap it closes, why this food is in season now, why it fits the household's affordability — with no clinical jargon.
- Severe cases (severe acute malnutrition, severe anaemia, obstetric danger signs) bypass nutrition advice entirely and route to referral. The LLM is not called. No feeding plan is generated.
- Recommendations align to WHO growth standards, WHO/IYCF anaemia thresholds, and GHS/CHPS protocol. Clinical thresholds are stored in versioned reference data — not hard-coded — so they can be updated by district nutrition officers without a code release, keeping on-device guidance current.
- Client data is governed by Ghana's Data Protection Act, 2012 (Act 843): only data the CHO already records on paper is collected, the purpose is limited to nutrition decision support for that CHO's caseload, and consent is recorded at registration before any data is saved.
- A complete visit record takes under 60 seconds of input. The priority list and feeding plan are returned instantly from on-device data. The app subtracts planning work from the CHO's round; it adds none.
- Client data stays on the device, encrypted at rest (AES-256), and syncs to district systems (DHIMS2-compatible) only when a connection is available. No client PII is sent to the LLM.

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

GitHub: <https://github.com/YakubuLute/nurturelink>

The repo is public and contains the full working prototype: React Native mobile app (screens: Register, Visit, Plan, Referral), deterministic recommendation engine with 50+ passing tests, Express.js backend with Prisma schema and seed data, and shared Zod schemas. The README describes the concept, the two core functions, the offline and responsible-AI design, and the bootcamp build plan.

---

## 6. Field grounding

The problem statement rests on Ghana-specific data:

- Northern Regional Health Directorate 2023 annual performance review: 100 institutional maternal deaths; ratio 136.7 per 100,000 live births (up from 69 in 2022).
- Peer-reviewed northern-Ghana IYCF studies: stunting ~33% among children 6–23 months; minimum acceptable diet ~38.9%; children eating fewer than 4 food groups ~4× more likely to be wasted.
- GDHS 2022: minimum acceptable diet 26.4% nationally; food insecurity 73.7% in Upper East Region (highest of the five northern regions); SDG 3.1 target <70 per 100,000 by 2030.
- DHIMS-2, 2018–2022: 91.8% of Savannah Region neonatal deaths occurred in the first seven days of life.

**Team field connection:**

- Yakubu Lute was born and raised in Tumu, Upper West Region — one of the five target regions named in the problem statement. He has lived in Tamale and witnessed firsthand the food insecurity and under-resourced health infrastructure that define daily life in Northern Ghana.
- Leticia Offeibea participated in Ghana's National Malaria Elimination Programme (USAID-funded), supporting malaria prevention, surveillance, and control at the community level. She is the team's primary contact for ongoing CHO field validation.

**CHO field conversation (August 2026).** Through Leticia's USAID Ghana network, the team connected with a working CHPS Community Health Officer for a 20-minute conversation about current nutrition counselling practice in the field.

The CHO shared their counselling protocol, which they carry from memory and a paper prompt sheet. For children 6–24 months: counsel on 3 meals plus 2 snacks daily, targeting 4+ food groups — staples (maize, rice, yam, cassava), protein (beans, egg, fish, chicken, groundnuts), fruits and vegetables (mango, pawpaw, kontomire, garden eggs), and fats/oils (palm oil, avocado, groundnut paste). Emphasis is placed on responsive feeding (no forcing), hand hygiene before meals, and Vitamin A supplementation every 6 months. For pregnant and breastfeeding women: the core field message is "eat for 2, but smart" — one extra meal or snack per day; daily iron and protein (beans, eggs, fish, liver, kontomire) to prevent anaemia; folate (oranges, beans, green vegetables) to prevent birth defects; 8–10 glasses of water daily especially when breastfeeding; strict ANC supplement adherence (iron-folate and deworming as prescribed); and avoidance of alcohol, excess caffeine, and raw or unwashed food.

**What this confirmed.** The CHO already works from a 4+ food-group framework that maps directly to the WHO Minimum Acceptable Diet criteria NurtureLink uses. The local foods they named — kontomire, garden eggs, groundnut paste, cowpea — are the same foods in NurtureLink's Northern Savannah seasonal database. The counselling is clinically sound and well-intentioned.

**The gap this revealed.** The CHO's guidance is population-level and seasonal-blind by necessity. They cannot quickly answer: of these protein sources, which are actually abundant and affordable in this specific community *this month*? And they have no way to know whether *this particular client's* haemoglobin or weight is trending down across visits without paging through paper records. NurtureLink closes both gaps without adding a single new measurement — it makes the same data they already collect actionable, client-specific, and seasonally current.

### Sources to cite
- Northern Regional Health Directorate, 2023 annual health performance review (via Ghana News Agency, Mar 2024): 100 institutional maternal deaths in 2023 vs 69 in 2022; ratio 136.7 per 100,000.
- Peer-reviewed northern-Ghana IYCF studies (BMC / NCBI): stunting ~33% among 6–23 months; minimum acceptable diet ~38.9%; children eating <4 food groups ~4x more likely to be wasted.
- GDHS 2022 (national): minimum acceptable diet 26.4% among 6–23 months; national maternal mortality context and SDG 3.1 target (<70 per 100,000 by 2030).
- UNICEF Ghana reports and the StartUp Lab concept note (UNICEF / UNICEF StartUp Lab LinkedIn) — read before finalising.
- DHIMS-2 (2018–2022): 91.8% of neonatal deaths in Savannah Region in the first seven days of life — cited in UNICEF StartUp Lab Hackathon concept note and workshop materials.

---

### Timeline

Applications close **11 August**. Virtual pre-workshops through August (attend if you can; not mandatory). Bootcamp **26–28 August, Tamale** (top 10 teams; fully sponsored — accommodation, feeding, transport stipend): day 1 shape the idea, day 2 build the MVP, day 3 pitch. Around ten awards, not winner-take-all. Teams own their IP.
