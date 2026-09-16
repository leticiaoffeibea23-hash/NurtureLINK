# NurtureLink — Health Audit Gap Analysis
**Source:** NurtureLink_Final_Presentable_Recommendations_with_App_Interfaces.pdf  
**Deadline:** Bootcamp Day 2 — 27 Aug 2026  
**Prepared by:** Claude Code (based on health auditor report + codebase snapshot)

---

## What Is Already Strong

| Feature | Status |
|---|---|
| Offline-first with encryption | ✅ Implemented (SQLCipher via op-sqlite) |
| Explainable client ranking ("Why ranked" card) | ✅ Implemented (ClientScreen) |
| Local-food feeding plans | ✅ Implemented (PlanScreen) |
| Voice counselling screen | ✅ Implemented (VoiceScreen) |
| Referral tracking (issue + confirm) | ✅ Implemented |
| Danger signs in visit form | ✅ Implemented |
| Diet diversity (8 food groups) | ✅ Implemented |
| MUAC, weight, haemoglobin capture | ✅ Implemented |
| Priority-ranked home list (urgent / stable) | ✅ Implemented |
| Sync with outbox + offline badge | ✅ Implemented |
| Supervisor dashboard | ✅ Implemented (SupervisorScreen) |
| DHIMS2 tally screen | ✅ Implemented (TallyScreen) |

---

## Gap Analysis — Grouped by Bootcamp Priority

### 🔴 MUST DO BEFORE DAY 2 (Aug 27)
*Clinical credibility + demo path completeness*

#### G1 · Registration form missing clinical fields
**File:** `apps/mobile/src/screens/RegisterScreen.tsx`

Current gaps vs. audit §5:

| Missing field | Client type |
|---|---|
| Phone number or household landmark | Both |
| ANC folder number | Pregnant |
| CWC card number | Child |
| Caregiver name + relationship to child | Child |
| Gravida and parity | Pregnant |
| Last menstrual period (LMP) — to calculate EDD | Pregnant |
| Ghana digital address (optional) | Both |

**Action:** Add these fields to RegisterScreen, store in Household + Client models.

---

#### G2 · Visit form is not split by client type
**File:** `apps/mobile/src/screens/VisitScreen.tsx`  
**Audit §6, §7, §9**

Currently one mixed form. Needed:

| Client type | Additional fields |
|---|---|
| **Pregnant woman** | Blood pressure (systolic/diastolic), ANC visit attended (Y/N), supplement given + adherence, gestational age at visit |
| **Child (0-5 mo)** | Exclusive breastfeeding Y/N, feeding frequency, difficulty feeding |
| **Child (6-23 mo)** | Complementary feeding (meal frequency, food texture, feeding during illness) |
| **Child (24-59 mo)** | Family diet variety, household food access |
| **All children** | Length/height (cm), bilateral oedema (Y/N) |

**Action:** Conditional field sections based on `client.type` and age-derived group.

---

#### G3 · Input fields show 0.0 as default instead of placeholder
**File:** `apps/mobile/src/screens/VisitScreen.tsx`  
**Audit §11.1**

A `0.0` weight or MUAC looks like a real measurement. Replace default value display with proper placeholder text:

| Field | Placeholder |
|---|---|
| Weight | "Enter weight" |
| Haemoglobin | "Enter haemoglobin" |
| MUAC | "Enter MUAC" |
| Blood pressure | "Enter systolic / diastolic" |

**Action:** Change TextInput `placeholder` and ensure empty string default (not 0).

---

#### G4 · No range validation on clinical values
**File:** `apps/mobile/src/screens/VisitScreen.tsx`  
**Audit §11.2**

Add soft validation — show Alert asking "This looks unusual, please recheck. Confirm anyway?" for:
- MUAC outside 50–250 mm
- Weight outside 0.5–150 kg
- Haemoglobin outside 3–20 g/dL
- Blood pressure systolic outside 60–200

Do NOT block submission — worker can confirm unusual value.

**Action:** Add `validateClinical()` helper called on form submit.

---

#### G5 · Bottom tab active state is too subtle
**File:** `apps/mobile/src/components/BottomTabBar.tsx`  
**Audit §3.1**

Current: only icon color changes. Needed: bold label + stronger visual indicator (underline, pill, or dot).

**Action:** In BottomTabBar, add `fontWeight: '700'` to active label, add a 3px orange bottom line or pill behind active tab.

---

#### G6 · Vitamin A tracking is completely absent
**Files:** `apps/mobile/src/screens/VisitScreen.tsx`, store  
**Audit §10.1**

The auditor flagged this as critical. Minimal viable implementation:
- Checkbox: "Vitamin A given this visit?"
- Auto-show dose recommendation based on age: `< 6 mo = not eligible`, `6-11 mo = 100,000 IU (blue)`, `12-59 mo = 200,000 IU (red)`
- Store last dose date so next due date can be calculated

**Action:** Add to visit form (child only). Store `vitaminAGiven: boolean, vitaminADate: string | null` on visit record.

---

#### G7 · Referral "Confirm seen" captures too little
**File:** `apps/mobile/src/screens/ReferralsListScreen.tsx`  
**Audit §14**

Currently "Confirm seen" only changes status. Should also capture:
- Confirmation date
- How confirmation was obtained (facility feedback / caregiver phone call / home follow-up / referral slip / supervisor)
- Outcome (basic: improving / no change / deteriorating / deceased)
- Next follow-up date

**Action:** Change the confirm button to open a modal with these 4 quick fields.

---

### 🟡 HIGH VALUE — DO IF TIME ALLOWS BEFORE DAY 2

#### G8 · Duplicate client check before saving
**Audit §4.2**

Before saving a new client in RegisterScreen, query local SQLite for clients in same community with same name (fuzzy) or same DOB. Show a warning card: "Possible existing record found. Review before creating new client."

---

#### G9 · Client IDs not shown in UI
**Audit §4**

The DB has UUID-based IDs but they are never shown. For the demo, derive a human-readable ID:
- Household: `HH-KUK-0147` (community prefix + sequential index)
- Client: `NL-KUK-2026-00428`

Show on ClientScreen header and RegisterScreen success screen.

---

#### G10 · Sync status messaging is too generic
**File:** `apps/mobile/src/screens/HomeScreen.tsx`  
**Audit §15.1**

Replace the simple "Offline" / "Synced" badge with contextual messages:
- Offline: "Working offline. 3 records saved on device."
- Online + complete: "All records synced. Last sync: Today 14:32."
- Online + partial: "4 synced. 1 needs correction."

---

#### G11 · DHIMS2 reporting is buried in Settings (Profile)
**Audit §15.2**

The tally / monthly report link should also appear on the HomeScreen (e.g., a banner card "November report — 87% complete · Due Dec 15") not only in Settings.

---

### 🟢 POST-HACKATHON / DAY 3 POLISH ONLY

| Gap | Audit ref | Why deferred |
|---|---|---|
| Postpartum / lactating mother lifecycle stage | §7 | Requires schema migration + new form |
| Newborn client type + assessment form | §8 | New client type + full form — significant scope |
| Full immunization tracker | §10.2 | Needs configurable EPI schedule reference data |
| AEFI recording | §10.3 | Complex; only meaningful after immunization tracker |
| Mortality and outcome indicators | §18 | Out of hackathon scope |
| Audit trail (who changed what + when) | §19 | Backend schema + middleware work |
| Mother ↔ child record linkage after delivery | §4.1 | Schema relationship + UI flow |
| Supervisor read-only banner when viewing worker caseload | §3.2 | Minor; add after core flows work |

---

## Aug 26–27 Sprint Plan

| Day | Tasks |
|---|---|
| **Day 1 (Aug 26)** | G3 (placeholders), G5 (tab active state), G4 (range validation), partial G1 (phone + caregiver name + ANC/CWC number fields) |
| **Day 2 (Aug 27)** | G2 (type-specific visit form: BP for pregnant + height/oedema for child), G6 (Vitamin A), G7 (confirm seen enrichment), G10 (sync messaging) |
| **Day 3 (Aug 28)** | G9 (client IDs), G11 (DHIMS2 on dashboard), G8 (duplicate check), demo path polish |

---

## Clinical Validation Note (from auditor, §22)

> Clinical thresholds and actions must be validated by Ghana Health Service or approved Ghanaian clinicians before deployment. This is a safety gate.

The current thresholds (MUAC < 115 mm → referral, Hb < 7 g/dL → referral) need sign-off from a GHS contact before field use. The auditor recommends a UDS (University for Development Studies) nutrition officer review sample plans against WHO/GHS guidance.
