import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

interface Facility {
  id: string;
  name: string;
  district: string;
  region: string;
}

export function DHIMSExportPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get<Facility[]>('/admin/facilities').then((facs) => {
      setFacilities(facs);
      if (facs.length > 0) setFacilityId(facs[0].id);
    }).catch(() => {/* API not connected */});
  }, []);

  async function handleExport() {
    if (!facilityId || !periodStart || !periodEnd) return;
    setIsExporting(true);
    setError('');
    try {
      const csv = await adminApi.post<string>('/export/dhims2', {
        facilityId,
        periodStart,
        periodEnd,
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `dhims2-${periodStart}-${periodEnd}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  }

  const selectedFacility = facilities.find((f) => f.id === facilityId);
  const canExport = !!facilityId && !!periodStart && !!periodEnd && !isExporting;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>DHIMS2 Export</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Generate a monthly CHPS tally summary matching the national DHIMS2 reporting format.
      </p>

      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 480, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Facility</label>
          {facilities.length === 0 ? (
            <input
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              placeholder="Loading facilities…"
              style={{ ...s.input, color: '#9ca3af' }}
              disabled
            />
          ) : (
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              style={s.input}
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.district}
                </option>
              ))}
            </select>
          )}
          {selectedFacility && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
              {selectedFacility.region} Region
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Period start</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            style={s.input}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={s.label}>Period end</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            style={s.input}
          />
        </div>

        {error && (
          <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={handleExport}
          disabled={!canExport}
          style={{
            padding: '12px 28px',
            background: '#1a7c4e',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            cursor: canExport ? 'pointer' : 'not-allowed',
            fontSize: 15,
            opacity: canExport ? 1 : 0.6,
          }}
        >
          {isExporting ? 'Generating…' : 'Download CSV'}
        </button>
      </div>

      <div style={{ marginTop: 24, background: '#f0f9ff', borderLeft: '4px solid #0ea5e9', padding: '12px 16px', borderRadius: 4, fontSize: 13, color: '#0369a1', maxWidth: 480 }}>
        <strong>Format note:</strong> The exported CSV follows the Ghana Health Service DHIMS2
        tally sheet format for Community-based Health Planning and Services (CHPS) nutrition
        indicators. Each row corresponds to one reporting period per facility.
      </div>
    </div>
  );
}

const s = {
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  } as const,
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box' as const,
    background: '#fff',
  } as const,
};
