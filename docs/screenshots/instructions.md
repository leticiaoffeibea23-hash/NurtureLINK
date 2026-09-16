 ## Tomorrow after taking screenshots:

  1. Save each screenshot to docs/screenshots/ using the exact filenames from pitch.md:
  01-login.png
  02-home-caseload.png
  03-client-amina-declining-hb.png
  04-plan-amina.png
  05-visit-form.png
  06-referral-guardrail.png
  07-referrals-list.png
  08-register-pregnant.png
  09-register-child.png
  2. Regenerate the PDF (one command, from the repo root):
  node docs/generate-pdf.mjs
  3. → outputs docs/NurtureLink-pitch.pdf
  4. The PDF includes: branded header bar (dark blue + orange), full styled document, all 8 screenshots embedded inline, checklist items,
  tables.

  The generated PDF is gitignored (330 KB without screenshots, ~2–4 MB with them). The source pitch.md and screenshots folder are
  committed.
