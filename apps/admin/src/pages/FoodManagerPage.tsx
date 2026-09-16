import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Food {
  id: string;
  name: string;
  localNames: { dagbani?: string; twi?: string } | null;
  foodGroup: string;
  nutrients: {
    ironMg: number; folateUg: number; proteinG: number;
    energyKcal: number; vitAUgRae: number; zincMg: number;
  } | null;
  affordabilityTier: string;
  storable: boolean;
  gardenWild: boolean;
  active: boolean;
}

const TIER_LABELS: Record<string, string> = {
  staple_cheap: 'Low cost',
  market:       'Market',
  premium:      'Premium',
};

const TIER_CYCLE = ['staple_cheap', 'market', 'premium'];

const TIER_COLORS: Record<string, string> = {
  staple_cheap: '#057A55',
  market:       '#B48700',
  premium:      '#7C3AED',
};

type SortKey = 'name' | 'foodGroup' | 'affordabilityTier' | 'ironMg' | 'proteinG' | 'energyKcal';

// ── Component ─────────────────────────────────────────────────────────────────

export function FoodManagerPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterGroup, setFilterGroup] = useState('');

  useEffect(() => {
    adminApi.get<Food[]>('/admin/foods')
      .then(setFoods)
      .catch(() => setMessage('Could not load foods from API.'))
      .finally(() => setLoading(false));
  }, []);

  const groups = Array.from(new Set(foods.map((f) => f.foodGroup))).sort();

  const getVal = (f: Food, key: SortKey): string | number => {
    if (key === 'ironMg')       return f.nutrients?.ironMg      ?? 0;
    if (key === 'proteinG')     return f.nutrients?.proteinG     ?? 0;
    if (key === 'energyKcal')   return f.nutrients?.energyKcal   ?? 0;
    if (key === 'foodGroup')    return f.foodGroup;
    if (key === 'affordabilityTier') return f.affordabilityTier;
    return f.name;
  };

  const sorted = [...foods]
    .filter((f) => !filterGroup || f.foodGroup === filterGroup)
    .sort((a, b) => {
      const av = getVal(a, sort);
      const bv = getVal(b, sort);
      return sortDir === 'asc'
        ? av < bv ? -1 : av > bv ? 1 : 0
        : av > bv ? -1 : av < bv ? 1 : 0;
    });

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setSortDir('asc'); }
  }

  async function cycleTier(food: Food) {
    const idx = TIER_CYCLE.indexOf(food.affordabilityTier);
    const nextTier = TIER_CYCLE[(idx + 1) % TIER_CYCLE.length];
    // Optimistic update
    setFoods((fs) => fs.map((f) => f.id === food.id ? { ...f, affordabilityTier: nextTier } : f));
    try {
      await adminApi.put(`/admin/foods/${food.id}`, { affordabilityTier: nextTier });
    } catch {
      // Revert on error
      setFoods((fs) => fs.map((f) => f.id === food.id ? { ...f, affordabilityTier: food.affordabilityTier } : f));
      setMessage('Failed to update tier.');
    }
  }

  async function toggleActive(food: Food) {
    const next = !food.active;
    setFoods((fs) => fs.map((f) => f.id === food.id ? { ...f, active: next } : f));
    try {
      await adminApi.put(`/admin/foods/${food.id}`, { active: next });
    } catch {
      setFoods((fs) => fs.map((f) => f.id === food.id ? { ...f, active: food.active } : f));
      setMessage('Failed to update active state.');
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage('');
    try {
      const csv = await file.text();
      const result = await adminApi.post<{ imported: number; errors: string[] }>(
        '/admin/foods/import',
        { csv },
      );
      setMessage(`Imported ${result.imported} food(s).${result.errors.length ? ` ${result.errors.length} row(s) skipped.` : ''}`);
      // Reload the list
      const updated = await adminApi.get<Food[]>('/admin/foods');
      setFoods(updated);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  const thSort = (key: SortKey, label: string) => (
    <th onClick={() => toggleSort(key)} style={{ ...s.th, cursor: 'pointer', userSelect: 'none' }}>
      {label} {sort === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      <h1 style={s.h1}>Food Composition Manager</h1>
      <p style={s.desc}>
        Manage the reference food library for Northern Ghana. Affordability tiers and active status
        can be edited inline. CSV import adds or updates rows by food name.
      </p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={s.btn}>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
          {isUploading ? 'Importing…' : '↑ Import CSV'}
        </label>

        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          style={s.select}
        >
          <option value="">All groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <span style={{ color: '#666', fontSize: 13 }}>
          {loading ? 'Loading…' : `${sorted.length} foods`}
        </span>
        {message && (
          <span style={{ color: message.includes('fail') || message.includes('Could') ? '#b91c1c' : '#057A55', fontWeight: 600, fontSize: 13 }}>
            {message}
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {thSort('name', 'Name')}
              <th style={s.th}>Dagbani</th>
              {thSort('foodGroup', 'Group')}
              {thSort('ironMg', 'Iron (mg)')}
              <th style={s.th}>Folate (µg)</th>
              {thSort('proteinG', 'Protein (g)')}
              {thSort('energyKcal', 'Energy (kcal)')}
              <th style={s.th}>Vit A (µg)</th>
              {thSort('affordabilityTier', 'Tier')}
              <th style={s.th}>Store</th>
              <th style={s.th}>Wild</th>
              <th style={s.th}>Active</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => {
              const n = f.nutrients ?? { ironMg: 0, folateUg: 0, proteinG: 0, energyKcal: 0, vitAUgRae: 0, zincMg: 0 };
              const tier = f.affordabilityTier;
              return (
                <tr key={f.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', opacity: f.active ? 1 : 0.45 }}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{f.name}</td>
                  <td style={{ ...s.td, color: '#666', fontStyle: 'italic' }}>
                    {(f.localNames as Record<string, string> | null)?.dagbani ?? '—'}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: '#f0f0f0', color: '#444' }}>{f.foodGroup}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{n.ironMg.toFixed(1)}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{n.folateUg}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{n.proteinG.toFixed(1)}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{n.energyKcal}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{n.vitAUgRae}</td>
                  <td style={s.td}>
                    <button
                      onClick={() => cycleTier(f)}
                      style={{
                        ...s.badge,
                        background: (TIER_COLORS[tier] ?? '#888') + '22',
                        color: TIER_COLORS[tier] ?? '#888',
                        border: `1px solid ${(TIER_COLORS[tier] ?? '#888')}44`,
                        cursor: 'pointer',
                      }}
                    >
                      {TIER_LABELS[tier] ?? tier}
                    </button>
                  </td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{f.storable ? '✓' : '–'}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{f.gardenWild ? '✓' : '–'}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    <button
                      onClick={() => toggleActive(f)}
                      style={{
                        padding: '2px 10px',
                        borderRadius: 12,
                        border: 'none',
                        background: f.active ? '#dcfce7' : '#fee2e2',
                        color: f.active ? '#15803d' : '#b91c1c',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {f.active ? 'Active' : 'Off'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
        Click a tier badge to cycle it. Inactive foods are excluded from generated plans.
        CSV format: <code>name, localName_dagbani, localName_twi, foodGroup, ironMg, folateUg, proteinG, energyKcal, vitAUgRae, zincMg, affordabilityTier, storable, gardenWild</code>
      </p>
    </div>
  );
}

const s = {
  h1:   { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 } as const,
  desc: { color: '#555', marginBottom: 20, lineHeight: 1.6 } as const,
  btn: {
    display: 'inline-block',
    padding: '9px 18px',
    background: '#08283B',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  } as const,
  select: {
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    background: '#fff',
  } as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td:    { padding: '10px 14px', borderBottom: '1px solid #f3f4f6' } as const,
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
  } as const,
};
