# TEMPLATE.md — agent & developer checklist

Use this when starting a **new client site** from `site-template`.

## 1. Change first (80% of the work)

| Priority | What | Where |
|----------|------|--------|
| 1 | Brand colors | `css/styles.css` → `:root` (`--color-*`) |
| 2 | Texts & CTA | `js/i18n/uk.js`, `js/i18n/en.js` |
| 3 | Menu / services | `content/menu.json` |
| 4 | Contacts & map | `content/contacts.json` |
| 5 | Reviews | `content/reviews.json` |
| 6 | Gallery | `content/gallery.json` + `img/gallery/*.webp` |
| 7 | Logo & hero | `img/assets/logo.webp`, `img/assets/hero.webp` |
| 8 | HTML title/favicon | `index.html` `<title>`, meta description |

**Visual reference for polish level:** `E:\PrProjects\Zerno` — match behavior and spacing, not coffee branding.

## 2. Do not break

- Section IDs: `#hero`, `#menu`, `#about`, `#gallery`, `#reviews`, `#contact`
- JS module paths in `index.html`
- `admin/config.yml` collection field names (must match JSON keys)
- `content/*.json` structure (`_uk` / `_en` suffixes)
- Mobile/tablet CSS split (`tablet.css`, `mobile.css`)

## 3. Per-client deploy setup

In `admin/config.yml`:

```yaml
backend:
  repo: CLIENT_ORG/CLIENT_REPO
site_url: https://client-domain.com
display_url: https://client-domain.com
base_url: https://your-oauth-proxy.example.com   # production only
local_backend: false                              # production
```

Copy `.github/workflows/` from template and adjust domain secrets for VPS deploy.

## 4. Before handoff

- [ ] All placeholders replaced or intentional
- [ ] Mobile + tablet checked (375px, 768px, 1024px)
- [ ] UA + EN switch works
- [ ] Form shows success stub (or Telegram hook if configured)
- [ ] Admin edits menu → site updates after publish
- [ ] `site_url` / favicon / logo consistent
- [ ] No «Your Business» / «Бізнес» left in production copy

## 5. Cursor prompt pattern

```
Base: E:\PrProjects\site-template (or client clone)
Reference quality: E:\PrProjects\Zerno
Brief: [business name, niche, colors, tone, photos]
Task: [e.g. rebrand for café «Wake Cup», warm palette, keep structure]
```

Do **not** use Power Gym as the only source unless cloning gym niche.

## 6. Estimated time (with template)

| Step | Time |
|------|------|
| Clone + palette + logo/hero | 1–2 h |
| JSON + i18n for client | 1–2 h |
| QA + deploy | 1 h |
| **Total** | ~3–5 h vs 8+ from scratch |
