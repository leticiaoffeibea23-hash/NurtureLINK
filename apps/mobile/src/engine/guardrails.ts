import { EngineFlag, ReferralRequired } from './types';

const SEVERE_FLAG_CODES = ['SEVERE_MUAC', 'SEVERE_ANAEMIA', 'DANGER_SIGNS'] as const;

/**
 * Step 0 of the engine: hard-stop referral check.
 * Returns ReferralRequired if any severe flag is present; null otherwise.
 *
 * This is a non-negotiable safety gate. Any severe flag blocks plan generation.
 * Thresholds that produce these flags are loaded from reference data (clinical_thresholds),
 * never hard-coded here.
 */
export function checkSevereFlags(flags: EngineFlag[]): ReferralRequired | null {
  const severeFlags = flags.filter((f) =>
    (SEVERE_FLAG_CODES as readonly string[]).includes(f.code),
  );
  if (severeFlags.length === 0) return null;

  return {
    kind: 'referral',
    triggeringFlags: severeFlags,
    message: buildReferralMessage(severeFlags),
  };
}

function buildReferralMessage(flags: EngineFlag[]): string {
  const reasons = flags.map((f) => {
    switch (f.code) {
      case 'SEVERE_MUAC':
        return `MUAC is ${f.value}mm — this indicates severe acute malnutrition`;
      case 'SEVERE_ANAEMIA':
        return `Haemoglobin is ${f.value} g/dL — this indicates severe anaemia`;
      case 'DANGER_SIGNS':
        return 'Obstetric danger signs are present';
      default:
        return f.code;
    }
  });
  return (
    'This client requires immediate referral to a health facility. ' +
    reasons.join('. ') +
    '. Do not attempt home management.'
  );
}
