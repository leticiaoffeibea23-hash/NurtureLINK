import { PrismaClient } from '@prisma/client';
import zlib from 'zlib';
import { promisify } from 'util';
import { ReferenceBundlePayload } from '@nurturelink/shared';

const prisma = new PrismaClient();
const gzip = promisify(zlib.gzip);

/**
 * Assembles the full ReferenceBundlePayload from PostgreSQL and returns it
 * as a gzipped JSON buffer — downloaded by devices on sync.
 *
 * The bundle format matches ReferenceBundlePayloadSchema in @nurturelink/shared
 * so the mobile bundle-loader and engine can consume it directly.
 */
export class BundleBuilder {
  async buildGzipped(versionTag: string): Promise<Buffer> {
    const payload = await this.build(versionTag);
    const json = JSON.stringify(payload);
    return gzip(json);
  }

  async build(versionTag: string): Promise<ReferenceBundlePayload> {
    const [agroZones, foods, seasonal, targets, thresholds, bundle] = await Promise.all([
      prisma.agroZone.findMany(),
      prisma.food.findMany({ where: { active: true } }),
      prisma.seasonalAvailability.findMany(),
      prisma.nutrientTarget.findMany(),
      prisma.clinicalThreshold.findMany(),
      prisma.referenceBundle.findUnique({ where: { versionTag } }),
    ]);

    if (!bundle) throw Object.assign(new Error(`Bundle ${versionTag} not found`), { status: 404 });

    return {
      versionTag: bundle.versionTag,
      checksum: bundle.checksum,
      agroZones: agroZones.map((z) => ({
        id: z.id,
        name: z.name,
        districts: z.districts as string[],
      })),
      foods: foods.map((f) => ({
        id: f.id,
        name: f.name,
        localNames: f.localNames as Record<string, string>,
        foodGroup: f.foodGroup,
        nutrients: f.nutrients as ReferenceBundlePayload['foods'][number]['nutrients'],
        affordabilityTier: f.affordabilityTier as ReferenceBundlePayload['foods'][number]['affordabilityTier'],
        storable: f.storable,
        gardenWild: f.gardenWild,
        active: f.active,
      })),
      seasonalAvailability: seasonal.map((s) => ({
        id: s.id,
        agroZoneId: s.agroZoneId,
        month: s.month,
        foodId: s.foodId,
        availability: s.availability as ReferenceBundlePayload['seasonalAvailability'][number]['availability'],
      })),
      nutrientTargets: targets.map((t) => ({
        id: t.id,
        profile: t.profile as ReferenceBundlePayload['nutrientTargets'][number]['profile'],
        nutrient: t.nutrient as ReferenceBundlePayload['nutrientTargets'][number]['nutrient'],
        dailyTarget: Number(t.dailyTarget),
        source: t.source,
      })),
      clinicalThresholds: thresholds.map((t) => ({
        id: t.id,
        metric: t.metric,
        condition: t.condition,
        severity: t.severity as ReferenceBundlePayload['clinicalThresholds'][number]['severity'],
        thresholdValue: Number(t.thresholdValue),
        thresholdDirection: t.thresholdDirection as ReferenceBundlePayload['clinicalThresholds'][number]['thresholdDirection'],
        source: t.source,
      })),
    };
  }
}
