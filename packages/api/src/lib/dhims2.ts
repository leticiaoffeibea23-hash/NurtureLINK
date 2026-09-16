import { TallyData } from '../repositories/export.repository';

/**
 * Generates a DHIMS2-compatible CSV tally sheet from aggregated visit data.
 * Format matches the national CHPS monthly summary sheet.
 */
export class Dhims2Exporter {
  toCsv(data: TallyData): string {
    const rows = [
      ['DHIMS2 Monthly Nutrition Tally', ''],
      ['Facility ID', data.facilityId],
      ['Period Start', data.periodStart.toISOString().slice(0, 10)],
      ['Period End', data.periodEnd.toISOString().slice(0, 10)],
      [''],
      ['Indicator', 'Count'],
      ['Total registered clients', data.totalClients],
      ['Pregnant women', data.pregnantClients],
      ['Children under 5', data.childClients],
      ['Total visits recorded', data.totalVisits],
      ['Referrals issued', data.referralsIssued],
      ['Nutrition plans generated', data.plansGenerated],
    ];

    return rows.map((row) => row.map(String).join(',')).join('\n');
  }
}
