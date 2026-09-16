import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PhraseEntry {
  phraseKey: string;
  audioUrl: string;
  language: string;
}

interface VoicePack {
  id: string;
  language: string;
  version: string;
  phrases: Record<string, string>;
}

const LANGUAGES = ['dagbani', 'twi', 'english'];

// ── Component ─────────────────────────────────────────────────────────────────

export function VoiceStudioPage() {
  const [phrases, setPhrases] = useState<PhraseEntry[]>([]);
  const [language, setLanguage] = useState('dagbani');
  const [phraseKey, setPhraseKey] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load existing phrases
  useEffect(() => {
    adminApi.get<VoicePack[]>('/admin/voice-packs').then((packs) => {
      const list: PhraseEntry[] = [];
      for (const pack of packs) {
        for (const [key, url] of Object.entries(pack.phrases ?? {})) {
          list.push({ phraseKey: key, audioUrl: String(url), language: pack.language });
        }
      }
      list.sort((a, b) => a.phraseKey.localeCompare(b.phraseKey));
      setPhrases(list);
    }).catch(() => {/* ignore */});
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !phraseKey.trim()) return;
    setUploading(true);
    setMessage('');
    try {
      // Read as base64 data URI (no S3 in hackathon scope)
      const audioUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await adminApi.post('/admin/voice-packs/phrase', {
        language,
        phraseKey: phraseKey.trim(),
        audioUrl,
      });

      const newEntry: PhraseEntry = { phraseKey: phraseKey.trim(), audioUrl, language };
      setPhrases((prev) => {
        const without = prev.filter((p) => !(p.phraseKey === newEntry.phraseKey && p.language === newEntry.language));
        return [...without, newEntry].sort((a, b) => a.phraseKey.localeCompare(b.phraseKey));
      });
      setMessage(`Uploaded "${phraseKey.trim()}" (${language}).`);
      setPhraseKey('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function playAudio(url: string, key: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingKey === key) { setPlayingKey(null); return; }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingKey(key);
    audio.play().catch(() => setMessage('Could not play audio.'));
    audio.onended = () => setPlayingKey(null);
  }

  const filteredPhrases = phrases.filter((p) => p.language === language);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Voice Pack Studio</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Upload pre-recorded audio clips for each phrase key. Audio must be in AAC-HE, MP3, or Opus
        format, 32 kbps mono. Each file should be under 100 KB.
      </p>

      {/* Upload form */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111' }}>Upload a phrase</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={s.label}>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={s.input}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={s.label}>Phrase key</label>
            <input
              value={phraseKey}
              onChange={(e) => setPhraseKey(e.target.value)}
              placeholder="e.g. greeting_morning, food_moringa"
              style={s.input}
            />
          </div>
          <label style={{
            ...s.uploadBtn,
            opacity: phraseKey.trim() ? 1 : 0.5,
            cursor: phraseKey.trim() ? 'pointer' : 'not-allowed',
          }}>
            <input
              type="file"
              accept=".mp3,.aac,.m4a,.ogg,.opus,.wav"
              style={{ display: 'none' }}
              disabled={!phraseKey.trim() || uploading}
              onChange={handleUpload}
            />
            {uploading ? 'Uploading…' : '↑ Upload Audio'}
          </label>
        </div>
        {message && (
          <p style={{ marginTop: 12, fontSize: 13, color: message.includes('fail') || message.includes('Could') ? '#b91c1c' : '#057A55', fontWeight: 600 }}>
            {message}
          </p>
        )}
      </div>

      {/* Phrase library */}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>Phrase library</h2>
          <div style={{ display: 'flex', gap: 4 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid #d1d5db',
                  background: language === l ? '#08283B' : '#fff',
                  color: language === l ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 'auto' }}>
            {filteredPhrases.length} phrase{filteredPhrases.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredPhrases.length === 0 ? (
          <div style={{ padding: 32, color: '#9ca3af', textAlign: 'center', fontSize: 14 }}>
            No phrases uploaded for {language} yet. Use the form above to add some.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={s.th}>Phrase key</th>
                <th style={{ ...s.th, textAlign: 'center', width: 100 }}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {filteredPhrases.map((p, i) => (
                <tr key={`${p.language}:${p.phraseKey}`} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontSize: 12 }}>
                    {p.phraseKey}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                    <button
                      onClick={() => playAudio(p.audioUrl, p.phraseKey)}
                      style={{
                        padding: '4px 14px',
                        background: playingKey === p.phraseKey ? '#057A55' : '#f3f4f6',
                        color: playingKey === p.phraseKey ? '#fff' : '#374151',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {playingKey === p.phraseKey ? '■ Stop' : '▶ Play'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
        Phrase keys follow the pattern <code>category_identifier</code>, e.g. <code>food_moringa</code>,
        <code>greeting_morning</code>, <code>instruction_eat_iron_foods</code>.
        Audio files are stored as data URIs in this demo build.
      </p>
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
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box' as const,
    background: '#fff',
  } as const,
  uploadBtn: {
    display: 'inline-block',
    padding: '10px 18px',
    background: '#08283B',
    color: '#fff',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 14,
  } as const,
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
};
