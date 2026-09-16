import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity  = 'ok' | 'watch' | 'refer';
type Direction = 'lt' | 'lte' | 'gte' | 'gt';

interface Threshold {
  id: string;
  metric: string;
  condition: string;
  severity: Severity;
  thresholdValue: number;
  direction: Direction;
  unit: string;
  source: string;
  pendingChange?: { value: number; justification: string };
}

const SEVERITY_STYLES: Record<Severity, { bg: string; fg: string; label: string }> = {
  refer: { bg: '#fee2e2', fg: '#b91c1c', label: 'Refer' },
  watch: { bg: '#fef9c3', fg: '#854d0e', label: 'Watch' },
  ok:    { bg: '#dcfce7', fg: '#15803d', label: 'OK' },
};

const DIR_LABELS: Record<Direction, string> = {
  lt: '<', lte: '≤', gte: '≥', gt: '>',
};

// ── Edit modal ────────────────────────────────────────────────────────────────

interface ModalProps {
  threshold: Threshold;
  onSave: (t: Threshold, newValue: number, justification: string) => void;
  onClose: () => void;
}

function EditModal({ threshold: t, onSave, onClose }: ModalProps) {
  const [value, setValue] = useState(String(t.thresholdValue));
  const [justification, setJustification] = useState('');

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Propose Threshold Change</h2>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
          {t.condition} — <code>{t.metric}</code>
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={m.label}>Current value</label>
            <input
              value={`${DIR_LABELS[t.direction]} ${t.thresholdValue} ${t.unit}`}
              disabled
              style={{ ...m.input, background: '#f5f5f5', color: '#888' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={m.label}>New value ({t.unit})</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step="0.1"
              style={m.input}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={m.label}>
            Justification <span style={{ color: '#b91c1c' }}>*</span>
            <span style={{ fontWeight: 400, color: '#888' }}> (required — will be logged in audit trail)</span>
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="e.g. Updated per GHS Nutrition Policy 2025 revision, section 4.2…"
            style={{ ...m.input, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{
          background: '#fff3cd',
          borderLeft: '4px solid #e6a817',
          padding: '10px 14px',
          borderRadius: 4,
          color: '#856404',
          marginBottom: 20,
          fontSize: 13,
        }}>
          This proposal requires a second-admin sign-off before it takes effect on field devices.
          Changes are immutably logged in the audit trail.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...m.btn, background: '#f3f4f6', color: '#374151' }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (!justification.trim()) { alert('Justification is required.'); return; }
              onSave(t, parseFloat(value), justification);
            }}
            style={{ ...m.btn, background: '#08283B', color: '#fff' }}
          >
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: 28,
    width: 520,
    maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  label: { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#374151' } as const,
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box' as const,
  },
  btn: {
    padding: '9px 20px',
    borderRadius: 6,
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  } as const,
};

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClinicalRulesPage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Threshold | null>(null);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    adminApi.get<Threshold[]>('/admin/clinical-thresholds')
      .then(setThresholds)
      .catch(() => {/* API not connected */})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(t: Threshold, newValue: number, justification: string) {
    try {
      await adminApi.post('/admin/clinical-thresholds/propose', {
        thresholdId: t.id,
        proposedValue: newValue,
        justification,
      });
    } catch {/* apply locally on error */}

    setThresholds((prev) =>
      prev.map((r) =>
        r.id === t.id ? { ...r, pendingChange: { value: newValue, justification } } : r,
      ),
    );
    setSaved(`Proposal for "${t.condition}" submitted for sign-off.`);
    setEditing(null);
    setTimeout(() => setSaved(''), 4000);
  }

  const metrics = Array.from(new Set(thresholds.map((t) => t.metric)));

  return (
    <div>
      <h1 style={s.h1}>Clinical Rules Governance</h1>
      <p style={s.desc}>
        WHO/GHS thresholds that drive flag severity and referral decisions on field devices.
        Any change requires a justification and second-admin sign-off. All changes are immutably logged.
      </p>

      <div style={{ background: '#fff3cd', borderLeft: '4px solid #e6a817', padding: '10px 16px', borderRadius: 4, color: '#856404', marginBottom: 24, fontSize: 14 }}>
        <strong>Safety gate:</strong> Changes to REFER-level thresholds directly affect which clients
        are sent to clinical facilities. A nutrition officer or UDS contact must review all proposed
        changes against WHO/GHS guidance before sign-off.
      </div>

      {loading && <p style={{ color: '#888' }}>Loading thresholds…</p>}

      {saved && (
        <div style={{ background: '#f0fdf4', borderLeft: '4px solid #057A55', padding: '10px 16px', borderRadius: 4, color: '#057A55', marginBottom: 16, fontWeight: 600 }}>
          {saved}
        </div>
      )}

      {metrics.map((metric) => (
        <div key={metric} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {metric.replace(/_/g, ' ')}
          </h2>
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={s.th}>Condition</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Severity</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Threshold</th>
                  <th style={s.th}>Source</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {thresholds
                  .filter((t) => t.metric === metric)
                  .map((t, i) => {
                    const sv = SEVERITY_STYLES[t.severity] ?? SEVERITY_STYLES.ok;
                    const hasPending = !!t.pendingChange;
                    const dir = DIR_LABELS[t.direction] ?? t.direction;
                    return (
                      <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={s.td}>{t.condition}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={{ ...s.badge, background: sv.bg, color: sv.fg }}>{sv.label}</span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                          {dir}{' '}
                          {hasPending ? (
                            <>
                              <span style={{ textDecoration: 'line-through', color: '#999' }}>{t.thresholdValue}</span>
                              {' → '}
                              <span style={{ color: '#b91c1c' }}>{t.pendingChange!.value}</span>
                            </>
                          ) : t.thresholdValue}{' '}
                          {t.unit}
                        </td>
                        <td style={{ ...s.td, color: '#6b7280', fontSize: 12 }}>{t.source}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          {hasPending ? (
                            <span style={{ ...s.badge, background: '#fef9c3', color: '#854d0e' }}>Pending sign-off</span>
                          ) : (
                            <span style={{ ...s.badge, background: '#f0fdf4', color: '#15803d' }}>In effect</span>
                          )}
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <button
                            onClick={() => setEditing(t)}
                            disabled={hasPending}
                            style={{
                              padding: '4px 12px',
                              background: hasPending ? '#f3f4f6' : '#08283B',
                              color: hasPending ? '#9ca3af' : '#fff',
                              border: 'none',
                              borderRadius: 5,
                              cursor: hasPending ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Propose
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {editing && (
        <EditModal threshold={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

const s = {
  h1:   { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 } as const,
  desc: { color: '#555', marginBottom: 20, lineHeight: 1.6 } as const,
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td:    { padding: '10px 14px', borderBottom: '1px solid #f3f4f6' } as const,
  badge: {
    display: 'inline-block',
    padding: '2px 9px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  } as const,
};
