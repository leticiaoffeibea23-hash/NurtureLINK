import { ExportRepository } from '../repositories/export.repository';
import { Dhims2Exporter } from '../lib/dhims2';

interface ExportInput {
  facilityId: string;
  periodStart: string;
  periodEnd: string;
}

export class ExportService {
  private repo = new ExportRepository();
  private exporter = new Dhims2Exporter();

  async generateDhims2Tally(input: ExportInput): Promise<string> {
    const data = await this.repo.aggregateForPeriod(
      input.facilityId,
      new Date(input.periodStart),
      new Date(input.periodEnd),
    );
    return this.exporter.toCsv(data);
  }
}
