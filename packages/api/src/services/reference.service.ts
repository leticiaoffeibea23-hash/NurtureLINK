import { ReferenceBundleManifest } from '@nurturelink/shared';
import { ReferenceRepository } from '../repositories/reference.repository';
import { BundleBuilder } from '../lib/bundle-builder';

export class ReferenceService {
  private repo = new ReferenceRepository();
  private builder = new BundleBuilder();

  async getManifest(): Promise<ReferenceBundleManifest> {
    const bundles = await this.repo.getActiveBundles();
    return {
      bundles: bundles.map((b) => ({
        versionTag: b.versionTag,
        description: b.description ?? null,
        checksum: b.checksum,
        publishedAt: b.publishedAt.toISOString(),
        tablesIncluded: b.tablesIncluded as string[],
        active: b.active,
      })),
    };
  }

  async getBundle(versionTag: string): Promise<Buffer> {
    const bundle = await this.repo.findBundle(versionTag);
    if (!bundle) throw Object.assign(new Error('Bundle not found'), { status: 404 });
    return this.builder.buildGzipped(versionTag);
  }
}
