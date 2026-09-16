import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminRepository {
  // ── Foods ──────────────────────────────────────────────────────────────────

  async getAllFoods() {
    return prisma.food.findMany({ orderBy: { name: 'asc' } });
  }

  async updateFood(id: string, patch: { affordabilityTier?: string; active?: boolean }) {
    return prisma.food.update({ where: { id }, data: patch as Parameters<typeof prisma.food.update>[0]['data'] });
  }

  async upsertFood(data: {
    id?: string;
    name: string;
    localNames: object;
    foodGroup: string;
    nutrients: object;
    affordabilityTier: string;
    storable: boolean;
    gardenWild: boolean;
  }) {
    const { id, ...rest } = data;
    if (id) {
      return prisma.food.upsert({
        where: { id },
        update: rest as Parameters<typeof prisma.food.upsert>[0]['update'],
        create: { id, ...(rest as Parameters<typeof prisma.food.upsert>[0]['create']) },
      });
    }
    return prisma.food.create({ data: rest as Parameters<typeof prisma.food.create>[0]['data'] });
  }

  // ── Seasonal Availability ──────────────────────────────────────────────────

  async getSeasonalByZone(agroZoneId: string) {
    return prisma.seasonalAvailability.findMany({
      where: { agroZoneId },
      include: { food: { select: { id: true, name: true, foodGroup: true } } },
      orderBy: [{ month: 'asc' }, { food: { name: 'asc' } }],
    });
  }

  async upsertSeasonalCell(
    agroZoneId: string,
    month: number,
    foodId: string,
    availability: 'abundant' | 'available' | 'scarce',
  ) {
    return prisma.seasonalAvailability.upsert({
      where: { agroZoneId_month_foodId: { agroZoneId, month, foodId } },
      update: { availability, updatedAt: new Date() },
      create: { agroZoneId, month, foodId, availability },
    });
  }

  // ── AgroZones ──────────────────────────────────────────────────────────────

  async getAllAgroZones() {
    return prisma.agroZone.findMany({ orderBy: { name: 'asc' } });
  }

  // ── Clinical Thresholds ────────────────────────────────────────────────────

  async getAllThresholds() {
    return prisma.clinicalThreshold.findMany({
      orderBy: [{ metric: 'asc' }, { condition: 'asc' }, { severity: 'asc' }],
    });
  }

  // ── Reference Bundles ──────────────────────────────────────────────────────

  async getLatestBundle() {
    return prisma.referenceBundle.findFirst({ where: { active: true }, orderBy: { publishedAt: 'desc' } });
  }

  async createBundle(data: {
    id: string;
    versionTag: string;
    description: string;
    tablesIncluded: string[];
    checksum: string;
    publishedBy: string;
  }) {
    // Deactivate previous bundles
    await prisma.referenceBundle.updateMany({ where: { active: true }, data: { active: false } });
    return prisma.referenceBundle.create({ data: { ...data, active: true } });
  }

  // ── Facilities ─────────────────────────────────────────────────────────────

  async getAllFacilities() {
    return prisma.facility.findMany({
      where: { active: true },
      select: { id: true, name: true, district: true, region: true },
      orderBy: [{ region: 'asc' }, { name: 'asc' }],
    });
  }

  // ── Voice Packs ────────────────────────────────────────────────────────────

  async getAllVoicePacks() {
    return prisma.voicePack.findMany({
      where: { active: true },
      orderBy: [{ language: 'asc' }, { version: 'asc' }],
    });
  }

  async upsertVoicePack(data: {
    language: string;
    version: string;
    phraseKey: string;
    audioUrl: string;
  }) {
    // Each voice pack row is keyed by language + version.
    // We store individual phrases inside the JSON `phrases` field.
    const existing = await prisma.voicePack.findFirst({
      where: { language: data.language, version: data.version },
    });

    if (existing) {
      const phrases = (existing.phrases as Record<string, string>) ?? {};
      phrases[data.phraseKey] = data.audioUrl;
      return prisma.voicePack.update({
        where: { id: existing.id },
        data: { phrases },
      });
    }

    return prisma.voicePack.create({
      data: {
        language: data.language,
        version: data.version,
        phrases: { [data.phraseKey]: data.audioUrl },
        templateMap: {},
        bundleUrl: null,
        active: true,
      },
    });
  }
}
