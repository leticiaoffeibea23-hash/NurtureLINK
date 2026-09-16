import { FlagCode, AffordabilityTier, Availability } from '@nurturelink/shared';

export type ClientType = 'pregnant' | 'child';
export type NutrientProfile = 'pregnant' | 'child_6_23m' | 'child_24_59m';

export interface EngineFlag {
  code: FlagCode;
  value?: number;
  detail?: string;
}

export interface PlanInput {
  clientType: ClientType;
  ageMonths?: number;        // children only
  gestationWeeks?: number;   // pregnant only
  flags: EngineFlag[];
  agroZoneId: string;
  currentMonth: number;      // 1–12
  affordabilityCeiling: AffordabilityTier;
}

export interface FoodCandidate {
  id: string;
  name: string;
  localName: string;
  foodGroup: string;
  tier: AffordabilityTier;
  storable: boolean;
  gardenWild: boolean;
  availability: Availability;
  nutrients: NutrientMap;
}

export type NutrientKey = 'ironMg' | 'folateUg' | 'proteinG' | 'energyKcal' | 'vitAUgRae' | 'zincMg';
export type NutrientMap = Record<NutrientKey, number>;
export type NutrientTargetMap = Partial<Record<NutrientKey, number>>;

export interface SelectedFood {
  id: string;
  name: string;
  localName: string;
  foodGroup: string;
  tier: AffordabilityTier;
  reasons: string[];
}

export interface RationaleEntry {
  foodId: string;
  reasons: string[];
}

export interface PlanResult {
  kind: 'plan';
  targetNutrients: NutrientKey[];
  selectedFoods: SelectedFood[];
  adequacy: Partial<Record<NutrientKey, number>>;
  rationale: RationaleEntry[];
  voiceScriptTemplate: string;
  referenceBundleVersion: string;
}

export interface ReferralRequired {
  kind: 'referral';
  triggeringFlags: EngineFlag[];
  message: string;
}

export type EngineResult = PlanResult | ReferralRequired;

export interface ReferenceBundle {
  version: string;
  foods: FoodCandidate[];
  seasonalAvailability: Array<{
    agroZoneId: string;
    month: number;
    foodId: string;
    availability: Availability;
  }>;
  nutrientTargets: Array<{
    profile: NutrientProfile;
    nutrient: NutrientKey;
    dailyTarget: number;
  }>;
  clinicalThresholds: Array<{
    metric: string;
    condition: string;
    severity: string;
    thresholdValue: number;
    thresholdDirection: 'lt' | 'lte' | 'gte' | 'gt';
  }>;
}
