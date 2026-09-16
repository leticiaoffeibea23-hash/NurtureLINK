/**
 * generate-pdf.mjs — convert docs/pitch.md → docs/NurtureLink-pitch.pdf
 *
 * Usage (from repo root):
 *   node docs/generate-pdf.mjs
 *
 * Requires: Chrome / Chromium installed on the machine.
 * Screenshots must be in docs/screenshots/ before running.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mdPath   = resolve(__dirname, 'pitch.md');
const htmlPath = resolve(__dirname, '_pitch_tmp.html');
const pdfPath  = resolve(__dirname, 'NurtureLink-pitch.pdf');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const md = readFileSync(mdPath, 'utf8');
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NurtureLink — Application Pitch</title>
<style>
  /* ── Page setup ── */
  @page { size: A4; margin: 18mm 20mm 18mm 20mm; }
  * { box-sizing: border-box; }

  /* ── Base typography ── */
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.6;
    color: #1a1a2e;
    background: #fff;
  }

  /* ── Headings ── */
  h1 {
    font-size: 22px;
    font-weight: 800;
    color: #08283B;
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }
  h2 {
    font-size: 15px;
    font-weight: 700;
    color: #08283B;
    border-bottom: 2px solid #FF5A00;
    padding-bottom: 4px;
    margin: 28px 0 10px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    margin: 16px 0 6px;
    page-break-after: avoid;
  }

  /* ── Body text ── */
  p { margin: 0 0 8px; }
  strong { color: #08283B; }
  em { color: #6B7280; }
  code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 10px;
    background: #F3F4F6;
    color: #B54000;
    padding: 1px 4px;
    border-radius: 3px;
  }

  /* ── Links ── */
  a { color: #FF5A00; text-decoration: none; }

  /* ── Lists ── */
  ul, ol { margin: 4px 0 10px 0; padding-left: 18px; }
  li { margin-bottom: 3px; }
  li p { margin: 0; }

  /* ── Blockquotes (used for designer notes) ── */
  blockquote {
    margin: 8px 0;
    padding: 8px 12px;
    background: #FFF9E6;
    border-left: 3px solid #FF5A00;
    color: #374151;
    font-size: 10.5px;
  }
  blockquote p { margin: 0; }

  /* ── Horizontal rule ── */
  hr {
    border: none;
    border-top: 1px solid #E5E7EB;
    margin: 16px 0;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
    margin: 8px 0 14px;
    page-break-inside: avoid;
  }
  th {
    background: #08283B;
    color: #fff;
    padding: 6px 8px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #E5E7EB;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #F9FAFB; }

  /* ── Screenshots ── */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 10px auto 6px;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    page-break-inside: avoid;
  }

  /* ── Checklist ── */
  input[type="checkbox"] { accent-color: #FF5A00; margin-right: 5px; }

  /* ── Header accent bar ── */
  .header-bar {
    background: linear-gradient(135deg, #08283B 0%, #0d3d58 100%);
    color: #fff;
    padding: 16px 20px 14px;
    margin: -18mm -20mm 20px;
    border-bottom: 3px solid #FF5A00;
  }
  .header-bar h1 { color: #fff; margin: 0; font-size: 24px; }
  .header-bar .tagline { font-size: 11px; color: #92C9F9; margin: 4px 0 0; }
  .header-bar .meta { font-size: 10px; color: #B4DAFB; margin-top: 6px; }

  /* ── Page break helpers ── */
  .page-break { page-break-before: always; }
</style>
</head>
<body>
<div class="header-bar">
  <h1>NurtureLink</h1>
  <p class="tagline">Offline-first nutrition decision support for CHPS Community Health Officers in rural Northern Ghana</p>
  <p class="meta">UNICEF AI for Nurturing Care Hackathon · KOICA / MEST StartUp Lab · Bootcamp: 26–28 August 2026, Tamale &nbsp;|&nbsp; <a href="https://github.com/YakubuLute/nurturelink" style="color:#B4DAFB">github.com/YakubuLute/nurturelink</a></p>
</div>
${body}
</body>
</html>`;

writeFileSync(htmlPath, html, 'utf8');
console.log('✓ HTML written:', htmlPath);

try {
  execSync(
    `"${CHROME}" --headless=new --disable-gpu --no-sandbox \
      --print-to-pdf="${pdfPath}" \
      --print-to-pdf-no-header \
      --no-margins-for-printing \
      "${htmlPath}"`,
    { stdio: 'inherit' },
  );
  console.log('✓ PDF written:', pdfPath);
} finally {
  // Clean up temp HTML
  try { execSync(`rm "${htmlPath}"`); } catch {}
}
