import {
  PlanInput,
  EngineResult,
  NutrientKey,
  NutrientTargetMap,
  ReferenceBundle,
  NutrientProfile,
} from './types';
import { checkSevereFlags } from './guardrails';
import { buildCandidateSet } from './candidate-set';
import { selectBasket } from './scorer';
import { computeAdequacy } from './adequacy';
import { buildRationale } from './rationale';
import { buildScriptTemplate } from './script-template';

/**
 * NurtureLink Recommendation Engine — deterministic, on-device, offline-capable.
 *
 * This is a pure function: given the same inputs and reference bundle, it always
 * returns the same result. No network calls, no side effects, no randomness.
 *
 * SAFETY: Severe cases (SEVERE_MUAC, SEVERE_ANAEMIA, DANGER_SIGNS) always return
 * ReferralRequired. Plan generation is blocked entirely.
 */
export function generatePlan(input: PlanInput, bundle: ReferenceBundle): EngineResult {
  // ── Step 0: Referral guardrail ─────────────────────────────────────────────
  const referral = checkSevereFlags(input.flags);
  if (referral) return referral;

  // ── Step 1: Determine nutrient profile ────────────────────────────────────
  const profile = resolveProfile(input);
  const targets = resolveTargets(profile, bundle);

  // ── Step 2: Identify active nutrient gaps ─────────────────────────────────
  const activeNutrients = resolveActiveNutrients(input, profile, targets);

  // ── Step 3: Build candidate food set ──────────────────────────────────────
  const candidates = buildCandidateSet(
    bundle,
    input.agroZoneId,
    input.currentMonth,
    input.affordabilityCeiling,
  );

  // ── Steps 4–7: Select basket, compute adequacy, rationale, template ───────
  const basket = selectBasket(candidates, activeNutrients, targets);
  const adequacy = computeAdequacy(basket, targets);
  const rationale = buildRationale(basket, activeNutrients);
  const voiceScriptTemplate = buildScriptTemplate(input.clientType, basket, activeNutrients);

  return {
    kind: 'plan',
    targetNutrients: activeNutrients,
    selectedFoods: basket.map((food) => ({
      id: food.id,
      name: food.name,
      localName: food.localName,
      foodGroup: food.foodGroup,
      tier: food.tier,
      reasons: rationale.find((r) => r.foodId === food.id)?.reasons ?? [],
    })),
    adequacy,
    rationale,
    voiceScriptTemplate,
    referenceBundleVersion: bundle.version,
  };
}

function resolveProfile(input: PlanInput): NutrientProfile {
  if (input.clientType === 'pregnant') return 'pregnant';
  if (!input.ageMonths || input.ageMonths < 24) return 'child_6_23m';
  return 'child_24_59m';
}

function resolveTargets(profile: NutrientProfile, bundle: ReferenceBundle): NutrientTargetMap {
  const targets: NutrientTargetMap = {};
  for (const row of bundle.nutrientTargets) {
    if (row.profile === profile) {
      targets[row.nutrient] = row.dailyTarget;
    }
  }
  return targets;
}

function resolveActiveNutrients(
  input: PlanInput,
  _profile: NutrientProfile,
  targets: NutrientTargetMap,
): NutrientKey[] {
  const flagCodes = new Set(input.flags.map((f) => f.code));
  const active = new Set<NutrientKey>();

  if (flagCodes.has('FALLING_HB')) {
    active.add('ironMg');
    active.add('folateUg');
  }
  if (flagCodes.has('FLAT_WEIGHT')) {
    active.add('energyKcal');
    active.add('proteinG');
  }
  if (flagCodes.has('LOW_DIVERSITY')) {
    // Target all nutrients from the profile
    for (const nutrient of Object.keys(targets) as NutrientKey[]) {
      active.add(nutrient);
    }
  }

  // Default: address all nutrients for the profile (preventive plan)
  if (active.size === 0) {
    for (const nutrient of Object.keys(targets) as NutrientKey[]) {
      active.add(nutrient);
    }
  }

  return Array.from(active);
}
