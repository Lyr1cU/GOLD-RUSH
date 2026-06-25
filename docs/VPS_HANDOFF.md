# VPS handoff guide (universal)

Step-by-step checklist for delivering a static site template to a client on **real hosting (VPS) + custom domain**, with **Decap CMS** admin and **no dependency on the developer** after handoff (no Vercel, no GitHub Pages for production).

Use this for any project built on the same pipeline: static site + `content/*.json` + Decap admin + GitHub repo as content store.

---

## Architecture overview

```
Visitor  →  client-domain.com        →  VPS (nginx, static files)
Client   →  client-domain.com/admin  →  Decap CMS (same VPS)
Publish  →  GitHub repo              →  commit JSON / images
Deploy   →  GitHub Actions          →  rsync repo → VPS
Login    →  auth.client-domain.com   →  OAuth proxy on client VPS (not Vercel)
```

**GitHub** = content storage + admin auth (via OAuth). Not hosting.  
**VPS** = what visitors and the admin UI are served from.  
**GitHub Pages** = optional for your demo/portfolio only, not for client production.

---

## Golden rule

Do **not** enable Decap/OAuth until the site opens correctly on the VPS.

| Phase | Goal |
|-------|------|
| 1 | Site works on domain |
| 2 | Auto-deploy on push |
| 3 | OAuth proxy on VPS |
| 4 | Full Publish → site update |

If phase 1 fails, fix it before touching admin.

---

## Phase 0 — Gather info (15 min)

Fill this in per client/project:

| Item | Example |
|------|---------|
| VPS IP | `203.0.113.10` |
| VPS OS | Ubuntu 22.04 / 24.04 |
| SSH user | `deploy` or `root` |
| Web root | `/var/www/sitename` |
| Domain | `client-business.com` |
| Auth subdomain | `auth.client-business.com` |
| GitHub repo | `client-org/website` |
| GitHub account | client's (recommended) |

**Free domain for testing:** DuckDNS, FreeDNS (afraid.org), or any cheap TLD.  
**SSL:** Let's Encrypt via `certbot` (free, requires a domain).

---

## Phase 1 — Site on VPS (no admin yet)

**Goal:** `https://your-domain/` shows the full site (menu, gallery, reviews, contacts).

### 1.1 DNS

- Create **A record**: `@` → VPS IP  
- Optional: `www` → VPS IP  
- Wait for propagation (minutes to hours)

### 1.2 VPS — base setup

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/sitename
sudo chown -R $USER:www-data /var/www/sitename
```

### 1.3 Nginx — static site

Example `/etc/nginx/sites-available/sitename`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/sitename;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sitename /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 1.4 Upload files (manual first time)

From your machine, in the project root:

```bash
rsync -avz --exclude '.git/' --exclude '.github/' --exclude 'docs/' \
  ./ user@VPS_IP:/var/www/sitename/
```

### 1.5 SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 1.6 Verify

- [ ] Home page loads  
- [ ] All sections render (JSON content loads)  
- [ ] Images and CSS work  
- [ ] Mobile layout OK  
- [ ] Language switch works  

**Common failures:** wrong DNS, nginx `root` path, missing trailing slash / base path issues, firewall blocking 80/443.

---

## Phase 2 — Auto-deploy (GitHub Actions)

**Goal:** every `push` to `main` (including Decap Publish) syncs files to VPS.

### 2.1 Deploy SSH key

On your machine:

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

- **Private key** → GitHub repo secret `VPS_SSH_KEY`  
- **Public key** → VPS `~/.ssh/authorized_keys` for deploy user  

### 2.2 GitHub repo secrets

**Settings → Secrets and variables → Actions:**

| Secret | Value |
|--------|-------|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH user |
| `VPS_SSH_KEY` | private key (full PEM) |
| `VPS_PATH` | `/var/www/sitename` |

### 2.3 Workflow

Copy `.github/workflows/deploy-vps.yml` from the template. It runs `node scripts/build-pages.mjs` before rsync so catalog pages ship with pre-rendered cards.

For **production client repo**:

- Enable `on: push: branches: [main]`  
- Disable or remove `pages.yml` (GitHub Pages not used)  

For **your demo repo**:

- Keep `workflow_dispatch` only (manual) so Pages deploy is unaffected  

### 2.4 Verify

- [ ] Push a small change → Actions job green  
- [ ] File appears/updates on VPS  
- [ ] Site reflects the change  

**Common failures:** wrong secrets, SSH permissions, `VPS_PATH` not writable, port 22 blocked.

---

## Phase 3 — OAuth proxy on client VPS (no Vercel)

**Goal:** Decap **Login with GitHub** works; nothing stays on the developer's Vercel account.

### 3.1 Why a proxy is needed

Decap runs in the browser and cannot store the GitHub client secret. A small server handles OAuth (`/auth` and `/callback`).

### 3.2 DNS

- **A record**: `auth.your-domain.com` → same VPS IP  

### 3.3 Run OAuth service on VPS

Options:

- Adapt [ublabs/netlify-cms-oauth](https://github.com/ublabs/netlify-cms-oauth) to run as a Node app (PM2/systemd) instead of Vercel serverless  
- Or include a pre-built `oauth-server/` in your template  

Environment on VPS (`.env`):

```
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...
```

Nginx reverse proxy example:

```nginx
server {
    listen 443 ssl;
    server_name auth.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

Endpoints must match: `/auth` and `/callback`.

### 3.4 GitHub OAuth App

Create in **client's** GitHub account (Settings → Developer settings → OAuth Apps):

| Field | Value |
|-------|-------|
| Application name | `Site Name CMS` |
| Homepage URL | `https://your-domain.com/` |
| Authorization callback URL | `https://auth.your-domain.com/callback` |

Save **Client ID** and **Client Secret** → VPS `.env`.

### 3.5 Decap config (`admin/config.yml`)

```yaml
backend:
  name: github
  repo: client-org/website
  branch: main
  base_url: https://auth.your-domain.com
  auth_endpoint: auth

site_url: https://your-domain.com
display_url: https://your-domain.com
```

Deploy updated config to VPS.

### 3.6 Verify

- [ ] `https://your-domain.com/admin/` opens  
- [ ] Login with GitHub succeeds  
- [ ] Editor shows all collections  
- [ ] Publish does not error  

**Common failures:** callback URL mismatch, HTTP instead of HTTPS, wrong `base_url`, OAuth secrets not loaded, repo write permission missing.

---

## Phase 4 — Full client flow

**Goal:** client edits content → Publish → live site updates.

1. Open `https://your-domain.com/admin/`  
2. Login with GitHub (client credentials)  
3. Edit menu / gallery / reviews / contacts  
4. Click **Publish**  
5. Wait 1–2 minutes (GitHub Actions deploy)  
6. Hard refresh site (`Ctrl+Shift+R`) if needed  

- [ ] New content visible on production domain  
- [ ] Uploaded images work  
- [ ] UA/EN content correct  

---

## What to hand off to the client

| Give | Do not give (unless full IT handoff) |
|------|--------------------------------------|
| Site URL | Developer Vercel account |
| Admin URL | Developer OAuth apps |
| GitHub login (for admin only) | SSH keys (optional: give if they manage VPS) |
| One-page admin guide | Raw Decap/nginx docs |

**One-page client guide (template):**

1. Go to `https://your-domain.com/admin/`  
2. Log in with GitHub  
3. Open the section to edit (Menu, Gallery, etc.)  
4. Make changes → **Publish**  
5. Wait 2 minutes → refresh the site  

---

## Developer detach checklist (nothing left on you)

- [ ] Repo owned by client GitHub account  
- [ ] OAuth App in client's GitHub account  
- [ ] OAuth proxy on client's VPS (not your Vercel)  
- [ ] GitHub Actions secrets in client's repo  
- [ ] Domain and VPS billed to client  
- [ ] No personal secrets in repo or VPS  
- [ ] `admin/config.yml` points to client domain and repo  

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Empty menu/gallery/reviews | JSON path / base URL; hard refresh cache |
| Site styled but no content | `content/*.json` not deployed or fetch path wrong |
| Publish fails | GitHub token / repo write access / OAuth broken |
| Site old after Publish | Deploy workflow failed or not triggered |
| Login redirect error | Callback URL ≠ OAuth app settings |
| Login works, publish fails | User not collaborator on repo |
| SSL errors | certbot not run or DNS wrong |

---

## Testing strategy (recommended)

1. Use a **separate test repo** or branch — keep GitHub Pages demo intact.  
2. Complete phases **in order**; do not skip to admin.  
3. Use a free subdomain first; swap to client domain later.  
4. Document VPS IP, domains, and secrets per project in your private notes (not in git).  

---

## Template files involved

| File | Role |
|------|------|
| `.github/workflows/deploy-vps.yml` | Sync repo → VPS |
| `.github/workflows/pages.yml` | Demo only (GitHub Pages) |
| `admin/config.yml` | Decap + OAuth URLs |
| `admin/index.html` | Decap loader |
| `content/*.json` | Editable content |
| `scripts/build-pages.mjs` | Pre-render menu/promos HTML from JSON (runs in CI before deploy) |
| `oauth-server/` (optional) | Self-hosted OAuth on VPS |

---

## Related

- Demo setup: see root `README.md` (GitHub Pages + Vercel OAuth for portfolio)  
- This guide: **production handoff** on VPS with OAuth on client infrastructure  
