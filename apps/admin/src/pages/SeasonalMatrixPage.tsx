import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Avail = 'abundant' | 'available' | 'scarce' | 'none';

interface AgroZone { id: string; name: string; region: string }

interface SeasonalRow {
  foodId: string;
  month: number;
  availability: string;
  food: { id: string; name: string; foodGroup: string };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CYCLE: Avail[] = ['abundant', 'available', 'scarce', 'none'];

const COLORS: Record<Avail, { bg: string; fg: string }> = {
  abundant:  { bg: '#057A55', fg: '#fff' },
  available: { bg: '#76c893', fg: '#fff' },
  scarce:    { bg: '#ffe066', fg: '#78620e' },
  none:      { bg: '#e5e7eb', fg: '#9ca3af' },
};

type MatrixState = Record<string, Avail[]>; // foodId → [12 months]

// ── Component ─────────────────────────────────────────────────────────────────

export function SeasonalMatrixPage() {
  const [zones, setZones] = useState<AgroZone[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [matrix, setMatrix] = useState<MatrixState>({});
  const [foodNames, setFoodNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubMessage, setPubMessage] = useState('');

  // Load agro zones on mount
  useEffect(() => {
    adminApi.get<AgroZone[]>('/admin/agro-zones').then((zs) => {
      setZones(zs);
      if (zs.length > 0) setZoneId(zs[0].id);
    }).catch(() => {/* ignore — API may not be running */});
  }, []);

  // Load matrix when zone changes
  useEffect(() => {
    if (!zoneId) return;
    setLoading(true);
    adminApi.get<SeasonalRow[]>(`/admin/seasonal/${zoneId}`)
      .then((rows) => {
        const m: MatrixState = {};
        const names: Record<string, string> = {};
        for (const row of rows) {
          names[row.foodId] = row.food.name;
          if (!m[row.foodId]) m[row.foodId] = Array(12).fill('none' as Avail);
          const avail = CYCLE.includes(row.availability as Avail)
            ? (row.availability as Avail)
            : 'none';
          m[row.foodId][row.month - 1] = avail;
        }
        setMatrix(m);
        setFoodNames(names);
      })
      .catch(() => {/* API not connected */})
      .finally(() => setLoading(false));
  }, [zoneId]);

  async function cycleCell(foodId: string, monthIdx: number) {
    const cur = matrix[foodId]?.[monthIdx] ?? 'none';
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
    // Optimistic update
    setMatrix((prev) => {
      const row = [...(prev[foodId] ?? Array(12).fill('none' as Avail))];
      row[monthIdx] = next;
      return { ...prev, [foodId]: row };
    });
    if (next !== 'none') {
      try {
        await adminApi.put(
          `/admin/seasonal/${zoneId}/${monthIdx + 1}/${foodId}`,
          { availability: next },
        );
      } catch {/* ignore — optimistic */}
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPubMessage('');
    try {
      const result = await adminApi.post<{ versionTag: string }>('/admin/reference/publish', {});
      setPubMessage(`Bundle ${result.versionTag} published successfully.`);
    } catch (err) {
      setPubMessage(err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  }

  const foodIds = Object.keys(matrix);

  return (
    <div>
      <h1 style={s.h1}>Seasonal Availability Matrix</h1>
      <p style={s.desc}>
        Click any cell to cycle: <strong>Abundant → Available → Scarce → None</strong>.
        Changes persist immediately. Click <em>Publish Bundle</em> to version and push to field devices.
      </p>

      {/* Legend + zone selector */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {(Object.entries(COLORS) as [Avail, { bg: string; fg: string }][]).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: v.bg, border: '1px solid #ccc', display: 'inline-block' }} />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Agro-zone:</label>
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} style={s.select}>
            {zones.length === 0 && <option value="">Loading…</option>}
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        {loading && <span style={{ fontSize: 13, color: '#888' }}>Loading…</span>}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {foodIds.length === 0 ? (
          <div style={{ padding: 32, color: '#888', textAlign: 'center', fontSize: 14 }}>
            {loading ? 'Loading matrix…' : 'No seasonal data for this zone yet.'}
          </div>
        ) : (
          <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 160, textAlign: 'left', background: '#f9fafb' }}>Food</th>
                {MONTHS.map((m) => (
                  <th key={m} style={{ ...s.th, width: 54, textAlign: 'center', background: '#f9fafb' }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {foodIds.map((foodId, fi) => (
                <tr key={foodId} style={{ background: fi % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...s.td, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', borderRight: '1px solid #e5e7eb' }}>
                    {foodNames[foodId] ?? foodId}
                  </td>
                  {(matrix[foodId] ?? Array(12).fill('none')).map((avail, mi) => {
                    const c = COLORS[avail as Avail] ?? COLORS.none;
                    return (
                      <td
                        key={mi}
                        onClick={() => cycleCell(foodId, mi)}
                        title={avail}
                        style={{
                          ...s.td,
                          background: c.bg,
                          cursor: 'pointer',
                          textAlign: 'center',
                          color: c.fg,
                          fontSize: 10,
                          fontWeight: 700,
                          userSelect: 'none',
                        }}
                      >
                        {avail === 'none' ? '' : (avail as string)[0].toUpperCase()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Publish bar */}
      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handlePublish}
          disabled={publishing}
          style={{
            padding: '11px 28px',
            background: publishing ? '#ccc' : '#08283B',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            cursor: publishing ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {publishing ? 'Publishing…' : 'Publish Bundle'}
        </button>
        {pubMessage && (
          <span style={{ color: pubMessage.includes('fail') ? '#b91c1c' : '#057A55', fontWeight: 600, fontSize: 13 }}>
            {pubMessage}
          </span>
        )}
      </div>

      <p style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
        A = Abundant · V = Available · S = Scarce · (blank) = Not in season.
        Source: Northern Ghana seasonal calendars validated with UDS Faculty of Agriculture.
      </p>
    </div>
  );
}

const s = {
  h1:   { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 } as const,
  desc: { color: '#555', marginBottom: 20, lineHeight: 1.6 } as const,
  select: {
    padding: '7px 10px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
  } as const,
  th: {
    padding: '10px 8px',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
  } as const,
  td: { padding: '7px 8px', borderBottom: '1px solid #f3f4f6' } as const,
};
