import crypto from 'crypto';
import { AdminRepository } from '../repositories/admin.repository';

// In-memory store for threshold proposals (hackathon scope — replace with DB table in prod)
interface ThresholdProposal {
  id: string;
  thresholdId: string;
  metric: string;
  condition: string;
  currentValue: number;
  proposedValue: number;
  justification: string;
  proposedBy: string;
  proposedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}
const proposalStore = new Map<string, ThresholdProposal>();

export class AdminService {
  private repo = new AdminRepository();

  // ── Foods ──────────────────────────────────────────────────────────────────

  async listFoods() {
    return this.repo.getAllFoods();
  }

  async patchFood(id: string, patch: { affordabilityTier?: string; active?: boolean }) {
    return this.repo.updateFood(id, patch);
  }

  /**
   * Parse a CSV buffer into food rows and upsert them.
   * Expected CSV columns (header row required):
   *   name, localName_dagbani, localName_twi, foodGroup, ironMg, folateUg,
   *   proteinG, energyKcal, vitAUgRae, zincMg, affordabilityTier, storable, gardenWild
   */
  async importFoodsFromCsv(csvText: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { imported: 0, errors: ['CSV is empty or has no data rows'] };

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const errors: string[] = [];
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });

      if (!row['name']) { errors.push(`Row ${i + 1}: missing name`); continue; }

      try {
        await this.repo.upsertFood({
          name: row['name'],
          localNames: {
            dagbani: row['localname_dagbani'] ?? '',
            twi:     row['localname_twi'] ?? '',
          },
          foodGroup: row['foodgroup'] ?? 'grains_roots_tubers',
          nutrients: {
            ironMg:     parseFloat(row['ironmg'] ?? '0'),
            folateUg:   parseFloat(row['folateug'] ?? '0'),
            proteinG:   parseFloat(row['proteing'] ?? '0'),
            energyKcal: parseFloat(row['energykcal'] ?? '0'),
            vitAUgRae:  parseFloat(row['vitaugrae'] ?? '0'),
            zincMg:     parseFloat(row['zincmg'] ?? '0'),
          },
          affordabilityTier: row['affordabilitytier'] ?? 'market',
          storable:   row['storable'] === 'true',
          gardenWild: row['gardenwild'] === 'true',
        });
        imported++;
      } catch (e) {
        errors.push(`Row ${i + 1} (${row['name']}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { imported, errors };
  }

  // ── Seasonal Matrix ────────────────────────────────────────────────────────

  async getSeasonalMatrix(agroZoneId: string) {
    return this.repo.getSeasonalByZone(agroZoneId);
  }

  async updateSeasonalCell(
    agroZoneId: string,
    month: number,
    foodId: string,
    availability: 'abundant' | 'available' | 'scarce',
  ) {
    return this.repo.upsertSeasonalCell(agroZoneId, month, foodId, availability);
  }

  async listAgroZones() {
    return this.repo.getAllAgroZones();
  }

  // ── Bundle Publish ─────────────────────────────────────────────────────────

  async publishBundle(publishedBy: string): Promise<{ versionTag: string; checksum: string }> {
    const latest = await this.repo.getLatestBundle();
    const prevTag = latest?.versionTag ?? 'v0.0';

    // Increment patch version: v1.0-seed → v1.1, v1.2 → v1.3, etc.
    const match = prevTag.match(/v(\d+)\.(\d+)/);
    const major = match ? parseInt(match[1], 10) : 1;
    const minor = match ? parseInt(match[2], 10) + 1 : 1;
    const versionTag = `v${major}.${minor}`;

    const checksum = crypto
      .createHash('sha256')
      .update(versionTag + new Date().toISOString())
      .digest('hex');

    const id = crypto.randomUUID();
    await this.repo.createBundle({
      id,
      versionTag,
      description: `Published by admin on ${new Date().toLocaleDateString()}`,
      tablesIncluded: ['foods', 'seasonal_availability', 'nutrient_targets', 'clinical_thresholds', 'agro_zones'],
      checksum,
      publishedBy,
    });

    return { versionTag, checksum };
  }

  // ── Clinical Thresholds ────────────────────────────────────────────────────

  async listThresholds() {
    return this.repo.getAllThresholds();
  }

  async proposeThresholdChange(data: {
    thresholdId: string;
    proposedValue: number;
    justification: string;
    proposedBy: string;
  }): Promise<ThresholdProposal> {
    const thresholds = await this.repo.getAllThresholds();
    const threshold = thresholds.find((t) => t.id === data.thresholdId);
    if (!threshold) throw Object.assign(new Error('Threshold not found'), { status: 404 });

    const id = crypto.randomUUID();
    const proposal: ThresholdProposal = {
      id,
      thresholdId: data.thresholdId,
      metric: threshold.metric,
      condition: threshold.condition,
      currentValue: Number(threshold.thresholdValue),
      proposedValue: data.proposedValue,
      justification: data.justification,
      proposedBy: data.proposedBy,
      proposedAt: new Date().toISOString(),
      status: 'pending',
    };
    proposalStore.set(id, proposal);
    return proposal;
  }

  listProposals(): ThresholdProposal[] {
    return Array.from(proposalStore.values());
  }

  // ── Facilities ─────────────────────────────────────────────────────────────

  async listFacilities() {
    return this.repo.getAllFacilities();
  }

  // ── Voice Packs ────────────────────────────────────────────────────────────

  async listVoicePacks() {
    return this.repo.getAllVoicePacks();
  }

  async addVoicePhrase(data: {
    language: string;
    phraseKey: string;
    audioUrl: string;
  }) {
    return this.repo.upsertVoicePack({
      language: data.language,
      version: 'v1',
      phraseKey: data.phraseKey,
      audioUrl: data.audioUrl,
    });
  }
}
