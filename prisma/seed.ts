/**
 * NurtureLink pilot seed — all 5 northern Ghana regions.
 * Run with: pnpm --filter api db:seed
 *
 * QA credentials:
 *   CHO (Kukuo):       +233244000001 / Test1234  →  Abubakari Sulemana
 *   CHO (Sagnarigu):   +233244000003 / Test1234  →  Issah Tahiru
 *   Supervisor:        +233244000002 / Test1234  →  Fati Abdulai
 *   System Admin:      +233000000001 / Admin1234!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pilot data...\n');

  // ── Agro Zone: Northern Savannah ───────────────────────────────────────────
  const allDistricts = [
    // Northern Region
    'Tamale Metro', 'Sagnarigu', 'Nanton', 'Kumbungu', 'Tolon', 'Savelugu', 'Karaga',
    'Gushegu', 'Mion', 'Nanumba North', 'Nanumba South', 'Zabzugu', 'Yendi',
    // North East Region
    'East Mamprusi', 'West Mamprusi', 'Mamprugu Moaduri', 'Yunyoo-Nasuan',
    // Upper East Region
    'Bolgatanga Municipal', 'Bongo', 'Builsa North', 'Builsa South',
    'Kassena-Nankana East', 'Kassena-Nankana West', 'Talensi', 'Nabdam',
    'Pusiga', 'Tempane', 'Garu', 'Bawku Municipal', 'Bawku West',
    // Upper West Region
    'Wa Municipal', 'Wa West', 'Wa East', 'Nandom', 'Lawra', 'Jirapa',
    'Lambussie-Karni', 'Sissala East', 'Sissala West', 'Daffiama-Bussie-Issa',
    // Savannah Region
    'West Gonja', 'East Gonja', 'North Gonja', 'Central Gonja',
    'Bole', 'Sawla-Tuna-Kalba', 'Kpandai',
  ];

  const agroZone = await prisma.agroZone.upsert({
    where: { id: 'a1b2c3d4-0000-0000-0000-000000000001' },
    update: { districts: allDistricts },
    create: {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      name: 'Northern Savannah',
      districts: allDistricts,
    },
  });
  console.log(`✓ Agro zone: ${agroZone.name}`);

  // ── Facilities ─────────────────────────────────────────────────────────────
  const kukuoFacility = await prisma.facility.upsert({
    where: { id: 'f1000000-0000-0000-0000-000000000001' },
    update: { name: 'Kukuo CHPS Compound', district: 'Tamale Metro' },
    create: {
      id: 'f1000000-0000-0000-0000-000000000001',
      name: 'Kukuo CHPS Compound',
      district: 'Tamale Metro',
      region: 'Northern Region',
      agroZoneId: agroZone.id,
    },
  });

  const sagnarigu = await prisma.facility.upsert({
    where: { id: 'f1000000-0000-0000-0000-000000000003' },
    update: { name: 'Sagnarigu CHPS Compound', district: 'Tamale Metro' },
    create: {
      id: 'f1000000-0000-0000-0000-000000000003',
      name: 'Sagnarigu CHPS Compound',
      district: 'Tamale Metro',
      region: 'Northern Region',
      agroZoneId: agroZone.id,
    },
  });

  const nalerigu = await prisma.facility.upsert({
    where: { id: 'f1000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'f1000000-0000-0000-0000-000000000002',
      name: 'Nalerigu CHPS Compound',
      district: 'East Mamprusi',
      region: 'North East Region',
      agroZoneId: agroZone.id,
    },
  });
  // ── Northern Region (additional districts) ────────────────────────────────
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000004' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000004', name: 'Savelugu CHPS Compound',   district: 'Savelugu',        region: 'Northern Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000005' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000005', name: 'Yendi CHPS Compound',      district: 'Yendi',           region: 'Northern Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000006' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000006', name: 'Tolon CHPS Compound',      district: 'Tolon',           region: 'Northern Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000007' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000007', name: 'Kumbungu CHPS Compound',   district: 'Kumbungu',        region: 'Northern Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000008' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000008', name: 'Gushegu CHPS Compound',    district: 'Gushegu',         region: 'Northern Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000009' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000009', name: 'Karaga CHPS Compound',     district: 'Karaga',          region: 'Northern Region', agroZoneId: agroZone.id } });

  // ── North East Region (additional districts) ──────────────────────────────
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000010' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000010', name: 'Walewale CHPS Compound',   district: 'West Mamprusi',   region: 'North East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000011' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000011', name: 'Gambaga CHPS Compound',    district: 'East Mamprusi',   region: 'North East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000012' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000012', name: 'Yunyoo CHPS Compound',     district: 'Yunyoo-Nasuan',   region: 'North East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000013' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000013', name: 'Chereponi CHPS Compound',  district: 'Mamprugu Moaduri', region: 'North East Region', agroZoneId: agroZone.id } });

  // ── Upper East Region ─────────────────────────────────────────────────────
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000014' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000014', name: 'Bolgatanga CHPS Compound',  district: 'Bolgatanga Municipal', region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000015' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000015', name: 'Bawku CHPS Compound',       district: 'Bawku Municipal',  region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000016' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000016', name: 'Navrongo CHPS Compound',    district: 'Kassena-Nankana East', region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000017' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000017', name: 'Sandema CHPS Compound',     district: 'Builsa North',     region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000018' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000018', name: 'Bongo CHPS Compound',       district: 'Bongo',            region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000019' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000019', name: 'Paga CHPS Compound',        district: 'Kassena-Nankana West', region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000020' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000020', name: 'Tongo CHPS Compound',       district: 'Talensi',          region: 'Upper East Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000021' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000021', name: 'Zebilla CHPS Compound',     district: 'Bawku West',       region: 'Upper East Region', agroZoneId: agroZone.id } });

  // ── Upper West Region ─────────────────────────────────────────────────────
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000022' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000022', name: 'Wa CHPS Compound',          district: 'Wa Municipal',     region: 'Upper West Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000023' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000023', name: 'Lawra CHPS Compound',       district: 'Lawra',            region: 'Upper West Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000024' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000024', name: 'Nandom CHPS Compound',      district: 'Nandom',           region: 'Upper West Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000025' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000025', name: 'Jirapa CHPS Compound',      district: 'Jirapa',           region: 'Upper West Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000026' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000026', name: 'Tumu CHPS Compound',        district: 'Sissala East',     region: 'Upper West Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000027' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000027', name: 'Gwolu CHPS Compound',       district: 'Sissala West',     region: 'Upper West Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000028' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000028', name: 'Hamile CHPS Compound',      district: 'Lambussie-Karni',  region: 'Upper West Region', agroZoneId: agroZone.id } });

  // ── Savannah Region ───────────────────────────────────────────────────────
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000029' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000029', name: 'Damongo CHPS Compound',    district: 'West Gonja',       region: 'Savannah Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000030' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000030', name: 'Salaga CHPS Compound',     district: 'East Gonja',       region: 'Savannah Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000031' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000031', name: 'Bole CHPS Compound',       district: 'Bole',             region: 'Savannah Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000032' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000032', name: 'Sawla CHPS Compound',      district: 'Sawla-Tuna-Kalba', region: 'Savannah Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000033' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000033', name: 'Kpandai CHPS Compound',    district: 'Kpandai',          region: 'Savannah Region', agroZoneId: agroZone.id } });
  await prisma.facility.upsert({ where: { id: 'f1000000-0000-0000-0000-000000000034' }, update: {}, create: { id: 'f1000000-0000-0000-0000-000000000034', name: 'Yapei CHPS Compound',      district: 'Central Gonja',    region: 'Savannah Region', agroZoneId: agroZone.id } });

  console.log('✓ Facilities: 34 CHPS compounds across 5 northern regions');

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Test1234', 10);
  const adminHash = await bcrypt.hash('Admin1234!', 10);

  // CHO 1 — Abubakari Sulemana, Kukuo CHPS (primary QA CHO)
  await prisma.user.upsert({
    where: { phone: '+233244000001' },
    update: { firstName: 'Abubakari', lastName: 'Sulemana', facilityId: kukuoFacility.id },
    create: {
      id:           'u1000000-0000-0000-0000-000000000001',
      firstName:    'Abubakari',
      lastName:     'Sulemana',
      role:         'CHO',
      phone:        '+233244000001',
      passwordHash: passwordHash,
      facilityId:   kukuoFacility.id,
    },
  });

  // Supervisor — Fati Abdulai, Kukuo CHPS
  await prisma.user.upsert({
    where: { phone: '+233244000002' },
    update: { firstName: 'Fati', lastName: 'Abdulai', role: 'supervisor', facilityId: kukuoFacility.id },
    create: {
      id:           'u1000000-0000-0000-0000-000000000002',
      firstName:    'Fati',
      lastName:     'Abdulai',
      role:         'supervisor',
      phone:        '+233244000002',
      passwordHash: passwordHash,
      facilityId:   kukuoFacility.id,
    },
  });

  // CHO 2 — Issah Tahiru, Sagnarigu CHPS
  await prisma.user.upsert({
    where: { phone: '+233244000003' },
    update: { firstName: 'Issah', lastName: 'Tahiru', facilityId: sagnarigu.id },
    create: {
      id:           'u1000000-0000-0000-0000-000000000003',
      firstName:    'Issah',
      lastName:     'Tahiru',
      role:         'CHO',
      phone:        '+233244000003',
      passwordHash: passwordHash,
      facilityId:   sagnarigu.id,
    },
  });

  // System Admin
  await prisma.user.upsert({
    where: { phone: '+233000000001' },
    update: {},
    create: {
      id:           'u0000000-0000-0000-0000-000000000001',
      firstName:    'System',
      lastName:     'Admin',
      role:         'system_admin',
      phone:        '+233000000001',
      passwordHash: adminHash,
    },
  });
  console.log('✓ Users: Abubakari (+233244000001), Issah (+233244000003), Fati (+233244000002), Admin');

  // ── Nutrient Targets (WHO/IYCF) ────────────────────────────────────────────
  const targets: Array<{
    profile: 'pregnant' | 'child_6_23m' | 'child_24_59m';
    nutrient: string;
    dailyTarget: number;
    source: string;
  }> = [
    { profile: 'pregnant',     nutrient: 'ironMg',     dailyTarget: 27,   source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'folateUg',   dailyTarget: 600,  source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'energyKcal', dailyTarget: 2340, source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'proteinG',   dailyTarget: 71,   source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'vitAUgRae',  dailyTarget: 770,  source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'zincMg',     dailyTarget: 11,   source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'ironMg',     dailyTarget: 11,   source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'vitAUgRae',  dailyTarget: 400,  source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'zincMg',     dailyTarget: 3,    source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'proteinG',   dailyTarget: 13,   source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'energyKcal', dailyTarget: 810,  source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'ironMg',     dailyTarget: 7,    source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'proteinG',   dailyTarget: 19,   source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'energyKcal', dailyTarget: 1350, source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'vitAUgRae',  dailyTarget: 400,  source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'zincMg',     dailyTarget: 5,    source: 'WHO 2012 IYCF' },
  ];

  for (const t of targets) {
    await prisma.nutrientTarget.upsert({
      where: { profile_nutrient: { profile: t.profile, nutrient: t.nutrient } },
      update: {},
      create: t,
    });
  }
  console.log(`✓ Nutrient targets: ${targets.length} records`);

  // ── Clinical Thresholds (WHO/GHS) ──────────────────────────────────────────
  await prisma.clinicalThreshold.deleteMany();
  const thresholds = [
    { metric: 'muac_mm', condition: 'child', severity: 'refer' as const, thresholdValue: 115, thresholdDirection: 'lt', source: 'WHO 2009 Growth Standards' },
    { metric: 'muac_mm', condition: 'child', severity: 'watch' as const, thresholdValue: 125, thresholdDirection: 'lt', source: 'WHO 2009 Growth Standards' },
    { metric: 'hb_g_dl', condition: 'pregnant', severity: 'refer' as const, thresholdValue: 7.0,  thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    { metric: 'hb_g_dl', condition: 'pregnant', severity: 'watch' as const, thresholdValue: 11.0, thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    { metric: 'hb_g_dl', condition: 'child', severity: 'refer' as const, thresholdValue: 7.0,  thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    { metric: 'hb_g_dl', condition: 'child', severity: 'watch' as const, thresholdValue: 10.0, thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
  ];

  await prisma.clinicalThreshold.createMany({ data: thresholds });
  console.log(`✓ Clinical thresholds: ${thresholds.length} records`);

  // ── Foods (Northern Savannah) ──────────────────────────────────────────────
  const foods = [
    { id: 'fd000001-0000-0000-0000-000000000001', name: 'Moringa leaves (fresh)',     localNames: { dagbani: 'zogale', twi: 'moringa' }, foodGroup: 'vit_a_fruits_veg',     nutrients: { ironMg: 4.0, folateUg: 40,  proteinG: 6.7,  energyKcal: 64,   vitAUgRae: 378, zincMg: 0.6 }, affordabilityTier: 'staple_cheap' as const, storable: false, gardenWild: true  },
    { id: 'fd000002-0000-0000-0000-000000000001', name: 'Dried small fish (tilapia)', localNames: { dagbani: 'amani', twi: 'koobi' },    foodGroup: 'flesh_foods',           nutrients: { ironMg: 5.4, folateUg: 12,  proteinG: 47,   energyKcal: 218,  vitAUgRae: 15,  zincMg: 1.8 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000003-0000-0000-0000-000000000001', name: 'Cowpea (beans)',             localNames: { dagbani: 'tuya', twi: 'abrow' },     foodGroup: 'legumes_nuts',          nutrients: { ironMg: 4.3, folateUg: 208, proteinG: 23.5, energyKcal: 336,  vitAUgRae: 0,   zincMg: 3.4 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000004-0000-0000-0000-000000000001', name: 'Groundnut (peanut)',         localNames: { dagbani: 'sisim', twi: 'nkate' },    foodGroup: 'legumes_nuts',          nutrients: { ironMg: 2.0, folateUg: 68,  proteinG: 25.8, energyKcal: 567,  vitAUgRae: 0,   zincMg: 3.3 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000005-0000-0000-0000-000000000001', name: 'Sorghum (TZ / tuo zaafi)',   localNames: { dagbani: 'saa', twi: 'asana' },      foodGroup: 'grains_roots_tubers',   nutrients: { ironMg: 3.4, folateUg: 6,   proteinG: 10.6, energyKcal: 329,  vitAUgRae: 0,   zincMg: 1.7 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000006-0000-0000-0000-000000000001', name: 'Egg',                        localNames: { dagbani: 'poli', twi: 'ɛkyew' },     foodGroup: 'eggs',                  nutrients: { ironMg: 1.8, folateUg: 47,  proteinG: 12.6, energyKcal: 155,  vitAUgRae: 140, zincMg: 1.3 }, affordabilityTier: 'market' as const,       storable: false, gardenWild: false },
    { id: 'fd000007-0000-0000-0000-000000000001', name: 'Orange sweet potato',        localNames: { dagbani: 'wulijɛɣu', twi: 'ntamobuo' }, foodGroup: 'vit_a_fruits_veg', nutrients: { ironMg: 0.6, folateUg: 11,  proteinG: 1.6,  energyKcal: 86,   vitAUgRae: 961, zincMg: 0.3 }, affordabilityTier: 'market' as const,       storable: true,  gardenWild: false },
    { id: 'fd000008-0000-0000-0000-000000000001', name: 'Dawadawa (fermented locust bean)', localNames: { dagbani: 'dawadawa', twi: 'dawadawa' }, foodGroup: 'legumes_nuts', nutrients: { ironMg: 9.0, folateUg: 20,  proteinG: 35,   energyKcal: 395,  vitAUgRae: 0,   zincMg: 2.5 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000009-0000-0000-0000-000000000001', name: 'Millet',                     localNames: { dagbani: 'nyɔri', twi: 'millet' },   foodGroup: 'grains_roots_tubers',   nutrients: { ironMg: 3.0, folateUg: 85,  proteinG: 11.0, energyKcal: 378,  vitAUgRae: 0,   zincMg: 1.7 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000010-0000-0000-0000-000000000001', name: 'Baobab fruit pulp',          localNames: { dagbani: 'tuisim', twi: 'odum' },    foodGroup: 'other_fruits_veg',      nutrients: { ironMg: 0.6, folateUg: 0,   proteinG: 2.3,  energyKcal: 250,  vitAUgRae: 4,   zincMg: 0.1 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: true  },
    { id: 'fd000011-0000-0000-0000-000000000001', name: 'Bambara beans',              localNames: { dagbani: 'suya', twi: 'aboboe' },    foodGroup: 'legumes_nuts',          nutrients: { ironMg: 2.5, folateUg: 120, proteinG: 18.0, energyKcal: 360,  vitAUgRae: 0,   zincMg: 2.1 }, affordabilityTier: 'staple_cheap' as const, storable: true,  gardenWild: false },
    { id: 'fd000012-0000-0000-0000-000000000001', name: 'Pawpaw (papaya)',            localNames: { dagbani: 'boɣu', twi: 'bɔfre' },    foodGroup: 'vit_a_fruits_veg',      nutrients: { ironMg: 0.3, folateUg: 38,  proteinG: 0.5,  energyKcal: 39,   vitAUgRae: 47,  zincMg: 0.1 }, affordabilityTier: 'market' as const,       storable: false, gardenWild: true  },
  ];

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: {},
      create: food,
    });
  }
  console.log(`✓ Foods: ${foods.length} records`);

  // ── Seasonal Availability ──────────────────────────────────────────────────
  type Avail = 'abundant' | 'available' | 'scarce';
  const seasonal: Array<{ agroZoneId: string; month: number; foodId: string; availability: Avail }> = [
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000001-0000-0000-0000-000000000001', availability: (i >= 3 && i <= 9 ? 'abundant' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000002-0000-0000-0000-000000000001', availability: 'available' as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000003-0000-0000-0000-000000000001', availability: (i === 9 || i === 10 ? 'abundant' : i <= 1 ? 'scarce' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000004-0000-0000-0000-000000000001', availability: (i === 8 || i === 9 ? 'abundant' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000005-0000-0000-0000-000000000001', availability: (i === 10 || i === 11 ? 'abundant' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000006-0000-0000-0000-000000000001', availability: 'available' as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000007-0000-0000-0000-000000000001', availability: (i >= 8 && i <= 11 ? 'abundant' : i <= 1 ? 'scarce' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000008-0000-0000-0000-000000000001', availability: 'available' as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000009-0000-0000-0000-000000000001', availability: (i === 8 || i === 9 ? 'abundant' : i <= 1 ? 'scarce' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000010-0000-0000-0000-000000000001', availability: (i >= 11 || i <= 3 ? 'abundant' : i >= 4 && i <= 7 ? 'scarce' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000011-0000-0000-0000-000000000001', availability: (i === 9 || i === 10 ? 'abundant' : 'available') as Avail }))),
    ...(Array.from({ length: 12 }, (_, i) => ({ agroZoneId: agroZone.id, month: i + 1, foodId: 'fd000012-0000-0000-0000-000000000001', availability: (i >= 5 && i <= 9 ? 'abundant' : 'available') as Avail }))),
  ];

  for (const row of seasonal) {
    await prisma.seasonalAvailability.upsert({
      where: { agroZoneId_month_foodId: { agroZoneId: row.agroZoneId, month: row.month, foodId: row.foodId } },
      update: {},
      create: row,
    });
  }
  console.log(`✓ Seasonal availability: ${seasonal.length} records`);

  // ── Reference Bundle ───────────────────────────────────────────────────────
  const versionTag = 'v1.0-seed';
  const checksum = crypto.createHash('sha256').update(versionTag + foods.length).digest('hex');

  await prisma.referenceBundle.upsert({
    where: { versionTag },
    update: {},
    create: {
      id: 'rb000001-0000-0000-0000-000000000001',
      versionTag,
      description: 'Pilot seed — Northern Savannah (12 foods, 6 thresholds)',
      tablesIncluded: ['foods', 'seasonal_availability', 'nutrient_targets', 'clinical_thresholds', 'agro_zones'],
      checksum,
      active: true,
      publishedBy: 'u0000000-0000-0000-0000-000000000001',
    },
  });
  console.log(`✓ Reference bundle: ${versionTag}`);

  // ── QA Clinical Data (Kukuo CHPS — Abubakari's caseload) ───────────────────
  // Households
  const hhYakubu = await prisma.household.upsert({
    where: { id: 'h1000001-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000001-0000-0000-0000-000000000001', facilityId: kukuoFacility.id, label: 'Yakubu household', community: 'Kukuo' },
  });
  const hhIssah = await prisma.household.upsert({
    where: { id: 'h1000002-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000002-0000-0000-0000-000000000001', facilityId: kukuoFacility.id, label: 'Issah household', community: 'Choggu' },
  });
  const hhMahama = await prisma.household.upsert({
    where: { id: 'h1000003-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000003-0000-0000-0000-000000000001', facilityId: kukuoFacility.id, label: 'Mahama household', community: 'Katariga' },
  });
  const hhAlhassan = await prisma.household.upsert({
    where: { id: 'h1000004-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000004-0000-0000-0000-000000000001', facilityId: kukuoFacility.id, label: 'Alhassan household', community: 'Lamashegu' },
  });
  const hhMohammed = await prisma.household.upsert({
    where: { id: 'h1000005-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000005-0000-0000-0000-000000000001', facilityId: kukuoFacility.id, label: 'Mohammed household', community: 'Voggu' },
  });
  console.log(`✓ Households: 5 (Kukuo CHPS)`);

  // Clients
  const amina = await prisma.client.upsert({
    where: { id: 'c1000001-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000001-0000-0000-0000-000000000001', householdId: hhYakubu.id, type: 'pregnant', name: 'Amina Yakubu', dob: new Date('2002-03-15'), sex: 'F', consentAt: new Date('2026-06-03') },
  });
  const rahimatu = await prisma.client.upsert({
    where: { id: 'c1000002-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000002-0000-0000-0000-000000000001', householdId: hhIssah.id, type: 'child', name: 'Rahimatu Issah', dob: new Date('2024-12-01'), sex: 'F', consentAt: new Date('2026-05-20') },
  });
  const latif = await prisma.client.upsert({
    where: { id: 'c1000003-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000003-0000-0000-0000-000000000001', householdId: hhMahama.id, type: 'child', name: 'Abdul Latif Mahama', dob: new Date('2025-08-15'), sex: 'M', consentAt: new Date('2026-07-01') },
  });
  const zeinab = await prisma.client.upsert({
    where: { id: 'c1000004-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000004-0000-0000-0000-000000000001', householdId: hhAlhassan.id, type: 'pregnant', name: 'Zeinab Alhassan', dob: new Date('1999-04-10'), sex: 'F', consentAt: new Date('2026-06-10') },
  });
  const sadia = await prisma.client.upsert({
    where: { id: 'c1000005-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000005-0000-0000-0000-000000000001', householdId: hhMohammed.id, type: 'child', name: 'Sadia Mohammed', dob: new Date('2023-07-01'), sex: 'F', consentAt: new Date('2026-05-05') },
  });
  console.log(`✓ Clients: ${amina.name}, ${rahimatu.name}, ${latif.name}, ${zeinab.name}, ${sadia.name}`);

  const choId = 'u1000000-0000-0000-0000-000000000001'; // Abubakari

  // Visits — Amina Yakubu (Hb declining)
  const vAmina1 = await prisma.visit.upsert({
    where: { id: 'v1000001-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000001-0000-0000-0000-000000000001', clientId: amina.id, userId: choId, visitedAt: new Date('2026-06-03'), weightKg: 64.5, hbGDl: 11.2, muacMm: 242, dietRecall: ['grains','legumes','vita','veg'], dangerSigns: [], syncedAt: new Date('2026-06-03T14:00:00Z') },
  });
  const vAmina2 = await prisma.visit.upsert({
    where: { id: 'v1000002-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000002-0000-0000-0000-000000000001', clientId: amina.id, userId: choId, visitedAt: new Date('2026-06-28'), weightKg: 66.1, hbGDl: 10.4, muacMm: 238, dietRecall: ['grains','legumes'], dangerSigns: [], syncedAt: new Date('2026-06-28T11:00:00Z') },
  });
  const vAmina3 = await prisma.visit.upsert({
    where: { id: 'v1000003-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000003-0000-0000-0000-000000000001', clientId: amina.id, userId: choId, visitedAt: new Date('2026-07-18'), weightKg: 68.3, hbGDl: 9.6, muacMm: 235, dietRecall: ['grains'], dangerSigns: [] },
  });

  // Visits — Rahimatu Issah (flat weight)
  const vRahimatu1 = await prisma.visit.upsert({
    where: { id: 'v1000004-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000004-0000-0000-0000-000000000001', clientId: rahimatu.id, userId: choId, visitedAt: new Date('2026-05-20'), weightKg: 9.8, muacMm: 126, dietRecall: ['grains','breast'], dangerSigns: [], syncedAt: new Date('2026-05-20T10:00:00Z') },
  });
  const vRahimatu2 = await prisma.visit.upsert({
    where: { id: 'v1000005-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000005-0000-0000-0000-000000000001', clientId: rahimatu.id, userId: choId, visitedAt: new Date('2026-06-19'), weightKg: 9.8, muacMm: 122, dietRecall: ['grains'], dangerSigns: [], syncedAt: new Date('2026-06-19T09:30:00Z') },
  });
  const vRahimatu3 = await prisma.visit.upsert({
    where: { id: 'v1000006-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000006-0000-0000-0000-000000000001', clientId: rahimatu.id, userId: choId, visitedAt: new Date('2026-07-17'), weightKg: 9.9, muacMm: 124, dietRecall: ['grains','breast'], dangerSigns: [] },
  });

  // Visits — Abdul Latif Mahama (severe MUAC → referral)
  const vLatif1 = await prisma.visit.upsert({
    where: { id: 'v1000007-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000007-0000-0000-0000-000000000001', clientId: latif.id, userId: choId, visitedAt: new Date('2026-07-01'), weightKg: 6.4, muacMm: 115, dietRecall: ['grains','breast'], dangerSigns: [], syncedAt: new Date('2026-07-01T15:00:00Z') },
  });
  const vLatif2 = await prisma.visit.upsert({
    where: { id: 'v1000008-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000008-0000-0000-0000-000000000001', clientId: latif.id, userId: choId, visitedAt: new Date('2026-07-22'), weightKg: 6.1, muacMm: 108, dietRecall: ['grains'], dangerSigns: ['oedema'] },
  });

  // Visits — Zeinab Alhassan (stable)
  const vZeinab1 = await prisma.visit.upsert({
    where: { id: 'v1000009-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000009-0000-0000-0000-000000000001', clientId: zeinab.id, userId: choId, visitedAt: new Date('2026-06-10'), weightKg: 71.2, hbGDl: 11.8, muacMm: 256, dietRecall: ['grains','legumes','dairy','flesh','vita','veg'], dangerSigns: [], syncedAt: new Date('2026-06-10T11:00:00Z') },
  });
  const vZeinab2 = await prisma.visit.upsert({
    where: { id: 'v1000010-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000010-0000-0000-0000-000000000001', clientId: zeinab.id, userId: choId, visitedAt: new Date('2026-07-08'), weightKg: 73.6, hbGDl: 11.9, muacMm: 258, dietRecall: ['grains','legumes','eggs','vita','veg'], dangerSigns: [] },
  });

  // Visits — Sadia Mohammed (good progress)
  const vSadia1 = await prisma.visit.upsert({
    where: { id: 'v1000011-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000011-0000-0000-0000-000000000001', clientId: sadia.id, userId: choId, visitedAt: new Date('2026-05-05'), weightKg: 10.2, muacMm: 148, dietRecall: ['grains','legumes','vita'], dangerSigns: [], syncedAt: new Date('2026-05-05T10:00:00Z') },
  });
  const vSadia2 = await prisma.visit.upsert({
    where: { id: 'v1000012-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000012-0000-0000-0000-000000000001', clientId: sadia.id, userId: choId, visitedAt: new Date('2026-06-02'), weightKg: 10.6, muacMm: 151, dietRecall: ['grains','legumes','vita','veg'], dangerSigns: [], syncedAt: new Date('2026-06-02T09:00:00Z') },
  });
  const vSadia3 = await prisma.visit.upsert({
    where: { id: 'v1000013-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000013-0000-0000-0000-000000000001', clientId: sadia.id, userId: choId, visitedAt: new Date('2026-06-30'), weightKg: 10.9, muacMm: 153, dietRecall: ['grains','legumes','flesh','vita','veg'], dangerSigns: [] },
  });
  console.log('✓ Visits: 13 records (Kukuo caseload)');

  // Flags
  const bundleVer = versionTag;
  await prisma.flag.upsert({ where: { id: 'fl000001-0000-0000-0000-000000000001' }, update: {}, create: { id: 'fl000001-0000-0000-0000-000000000001', clientId: amina.id, visitId: vAmina3.id, severity: 'watch', reasons: ['Hb fell from 11.2 to 9.6 g/dL across 3 visits', 'Diet restricted to 1 food group at last visit'], computedAt: new Date('2026-07-18'), referenceBundleVersion: bundleVer } });
  await prisma.flag.upsert({ where: { id: 'fl000002-0000-0000-0000-000000000001' }, update: {}, create: { id: 'fl000002-0000-0000-0000-000000000001', clientId: rahimatu.id, visitId: vRahimatu3.id, severity: 'watch', reasons: ['No weight gain in 2 consecutive months', 'Diet restricted to 2 food groups'], computedAt: new Date('2026-07-17'), referenceBundleVersion: bundleVer } });
  await prisma.flag.upsert({ where: { id: 'fl000003-0000-0000-0000-000000000001' }, update: {}, create: { id: 'fl000003-0000-0000-0000-000000000001', clientId: latif.id, visitId: vLatif2.id, severity: 'refer', reasons: ['MUAC 108 mm — below severe-wasting threshold (115 mm)', 'Bilateral oedema present'], computedAt: new Date('2026-07-22'), referenceBundleVersion: bundleVer } });
  await prisma.flag.upsert({ where: { id: 'fl000004-0000-0000-0000-000000000001' }, update: {}, create: { id: 'fl000004-0000-0000-0000-000000000001', clientId: zeinab.id, visitId: vZeinab2.id, severity: 'ok', reasons: ['Hb stable at 11.9 g/dL', 'Good diet diversity: 5 food groups'], computedAt: new Date('2026-07-08'), referenceBundleVersion: bundleVer } });
  await prisma.flag.upsert({ where: { id: 'fl000005-0000-0000-0000-000000000001' }, update: {}, create: { id: 'fl000005-0000-0000-0000-000000000001', clientId: sadia.id, visitId: vSadia3.id, severity: 'ok', reasons: ['Weight gaining: 10.2 → 10.9 kg', 'Diet improved from 3 to 5 food groups'], computedAt: new Date('2026-06-30'), referenceBundleVersion: bundleVer } });
  console.log('✓ Flags: 5 records');

  // Referral — Abdul Latif Mahama → Tamale West Hospital
  await prisma.referral.upsert({
    where: { id: 'rf000001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'rf000001-0000-0000-0000-000000000001',
      clientId: latif.id,
      visitId: vLatif2.id,
      reason: 'MUAC 108 mm — below severe-wasting threshold (115 mm). Bilateral oedema present.',
      flagCodes: ['MUAC_REFER', 'DANGER_SIGNS'],
      facilityTo: 'Tamale West Hospital',
      status: 'issued',
      issuedAt: new Date('2026-07-22'),
    },
  });
  console.log('✓ Referral: Abdul Latif Mahama → Tamale West Hospital');

  // ── QA Clinical Data (Sagnarigu CHPS — Issah's caseload) ──────────────────
  const hhDagbon = await prisma.household.upsert({
    where: { id: 'h1000006-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000006-0000-0000-0000-000000000001', facilityId: sagnarigu.id, label: 'Dagbon household', community: 'Sagnarigu' },
  });
  const hhFuseini = await prisma.household.upsert({
    where: { id: 'h1000007-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'h1000007-0000-0000-0000-000000000001', facilityId: sagnarigu.id, label: 'Fuseini household', community: 'Kpalsi' },
  });

  const adisa = await prisma.client.upsert({
    where: { id: 'c1000006-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000006-0000-0000-0000-000000000001', householdId: hhDagbon.id, type: 'child', name: 'Adisa Dagbon', dob: new Date('2025-09-01'), sex: 'M', consentAt: new Date('2026-07-15') },
  });
  const hadiza = await prisma.client.upsert({
    where: { id: 'c1000007-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'c1000007-0000-0000-0000-000000000001', householdId: hhFuseini.id, type: 'pregnant', name: 'Hadiza Fuseini', dob: new Date('1998-06-01'), sex: 'F', consentAt: new Date('2026-07-10') },
  });

  const cho2Id = 'u1000000-0000-0000-0000-000000000003'; // Issah Tahiru
  await prisma.visit.upsert({
    where: { id: 'v1000014-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000014-0000-0000-0000-000000000001', clientId: adisa.id, userId: cho2Id, visitedAt: new Date('2026-07-15'), weightKg: 6.8, muacMm: 130, dietRecall: ['grains','breast'], dangerSigns: [] },
  });
  await prisma.visit.upsert({
    where: { id: 'v1000015-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'v1000015-0000-0000-0000-000000000001', clientId: hadiza.id, userId: cho2Id, visitedAt: new Date('2026-07-10'), weightKg: 68.0, hbGDl: 10.8, muacMm: 228, dietRecall: ['grains','legumes','vita'], dangerSigns: [] },
  });

  console.log(`✓ Sagnarigu CHPS: ${adisa.name}, ${hadiza.name} — 2 visits`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Seed complete ✓ — QA credentials:');
  console.log('   CHO (Kukuo):     +233244000001 / Test1234  →  Abubakari Sulemana');
  console.log('   CHO (Sagnarigu): +233244000003 / Test1234  →  Issah Tahiru');
  console.log('   Supervisor:      +233244000002 / Test1234  →  Fati Abdulai');
  console.log('   System Admin:    +233000000001 / Admin1234!');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
