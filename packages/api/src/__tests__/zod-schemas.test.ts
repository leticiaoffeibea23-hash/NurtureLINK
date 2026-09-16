/**
 * Shared Zod schema validation tests.
 *
 * Verifies that:
 * - Valid payloads parse correctly
 * - Invalid payloads (wrong PIN length, missing fields) are rejected
 * - Safety-critical schemas (danger signs, flag codes) accept only known values
 */

import { LoginSchema, RefreshTokenSchema } from '@nurturelink/shared';
import { CreateVisitSchema, DangerSignSchema, FlagCodeSchema } from '@nurturelink/shared';
import { CreateReferralSchema } from '@nurturelink/shared';
import { SyncMutationSchema } from '@nurturelink/shared';

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('LoginSchema', () => {
  it('accepts a valid phone + 4-digit PIN', () => {
    expect(() => LoginSchema.parse({ phone: '+233244000001', pin: '1234' })).not.toThrow();
  });

  it('rejects PIN shorter than 4 digits', () => {
    expect(() => LoginSchema.parse({ phone: '+233244000001', pin: '12' })).toThrow();
  });

  it('rejects PIN longer than 4 digits', () => {
    expect(() => LoginSchema.parse({ phone: '+233244000001', pin: '12345' })).toThrow();
  });

  it('rejects non-numeric PIN', () => {
    expect(() => LoginSchema.parse({ phone: '+233244000001', pin: 'abcd' })).toThrow();
  });

  it('rejects missing phone', () => {
    expect(() => LoginSchema.parse({ pin: '1234' })).toThrow();
  });
});

describe('RefreshTokenSchema', () => {
  it('accepts a refresh token string', () => {
    expect(() => RefreshTokenSchema.parse({ refreshToken: 'some-token' })).not.toThrow();
  });

  it('rejects missing refreshToken', () => {
    expect(() => RefreshTokenSchema.parse({})).toThrow();
  });
});

// ── Visit ─────────────────────────────────────────────────────────────────────

describe('DangerSignSchema', () => {
  const validSigns = [
    'severe_headache_visual',
    'severe_abdominal_pain',
    'heavy_vaginal_bleeding',
    'convulsions',
    'difficulty_breathing',
    'baby_not_moving',
    'bilateral_oedema',
    'pallor_severe',
  ];

  validSigns.forEach((sign) => {
    it(`accepts known danger sign: ${sign}`, () => {
      expect(() => DangerSignSchema.parse(sign)).not.toThrow();
    });
  });

  it('rejects an unknown danger sign', () => {
    expect(() => DangerSignSchema.parse('headache')).toThrow();
  });
});

describe('FlagCodeSchema', () => {
  const validCodes = ['FALLING_HB', 'FLAT_WEIGHT', 'LOW_DIVERSITY', 'DANGER_SIGNS', 'SEVERE_MUAC', 'SEVERE_ANAEMIA'];

  validCodes.forEach((code) => {
    it(`accepts known flag code: ${code}`, () => {
      expect(() => FlagCodeSchema.parse(code)).not.toThrow();
    });
  });

  it('rejects unknown flag code', () => {
    expect(() => FlagCodeSchema.parse('UNKNOWN_FLAG')).toThrow();
  });
});

describe('CreateVisitSchema', () => {
  const validVisit = {
    id: '00000000-0000-0000-0000-000000000001',
    clientId: '00000000-0000-0000-0000-000000000002',
    userId: '00000000-0000-0000-0000-000000000003',
    visitedAt: new Date().toISOString(),
    weightKg: 58.4,
    hbGDl: 9.6,
    muacMm: 235,
    dietRecall: ['grains_roots_tubers', 'legumes_nuts'],
    dangerSigns: [],
    notes: null,
    updatedAt: new Date().toISOString(),
  };

  it('accepts a valid visit', () => {
    expect(() => CreateVisitSchema.parse(validVisit)).not.toThrow();
  });

  it('rejects unknown diet recall food group', () => {
    expect(() =>
      CreateVisitSchema.parse({ ...validVisit, dietRecall: ['grains', 'unknown_group'] }),
    ).toThrow();
  });

  it('rejects unknown danger sign', () => {
    expect(() =>
      CreateVisitSchema.parse({ ...validVisit, dangerSigns: ['headache'] }),
    ).toThrow();
  });

  it('accepts null optional fields', () => {
    expect(() =>
      CreateVisitSchema.parse({ ...validVisit, weightKg: null, hbGDl: null, muacMm: null }),
    ).not.toThrow();
  });
});

// ── Referral ──────────────────────────────────────────────────────────────────

describe('CreateReferralSchema', () => {
  const validReferral = {
    id: '00000000-0000-0000-0000-000000000001',
    clientId: '00000000-0000-0000-0000-000000000002',
    visitId: '00000000-0000-0000-0000-000000000003',
    reason: 'MUAC below 115 mm',
    flagCodes: ['SEVERE_MUAC'],
    facilityTo: 'Tamale West Hospital',
    status: 'issued',
    queuedOffline: true,
    issuedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('accepts a valid referral', () => {
    expect(() => CreateReferralSchema.parse(validReferral)).not.toThrow();
  });

  it('rejects an invalid flag code in the referral', () => {
    expect(() =>
      CreateReferralSchema.parse({ ...validReferral, flagCodes: ['INVALID_CODE'] }),
    ).toThrow();
  });

  it('rejects an invalid status', () => {
    expect(() =>
      CreateReferralSchema.parse({ ...validReferral, status: 'unknown_status' }),
    ).toThrow();
  });
});

// ── Sync ──────────────────────────────────────────────────────────────────────

describe('SyncMutationSchema', () => {
  const validMutation = {
    idempotencyKey: '00000000-0000-0000-0000-000000000001',
    entityType: 'clients',
    entityId: '00000000-0000-0000-0000-000000000002',
    operation: 'insert',
    payload: { name: 'Test', type: 'child' },
  };

  it('accepts a valid mutation', () => {
    expect(() => SyncMutationSchema.parse(validMutation)).not.toThrow();
  });

  it('rejects unknown entity type', () => {
    expect(() =>
      SyncMutationSchema.parse({ ...validMutation, entityType: 'users' }),
    ).toThrow();
  });

  it('rejects unknown operation', () => {
    expect(() =>
      SyncMutationSchema.parse({ ...validMutation, operation: 'merge' }),
    ).toThrow();
  });
});
