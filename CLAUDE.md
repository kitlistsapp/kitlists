# KitLists — Claude/Cowork Handover

## What is KitLists?
KitLists (kitlists.app) is a camera department equipment list platform built for DOPs and 1st ACs in the Australian film/TV industry. Users build gear lists, collaborate with crew, and share with rental houses and production — controlling who sees what (ownership visibility, view mode).

Built by Lee Whitaker (Co-Founder, HACS) and Charlie Whitaker (1st AC, primary tester).

---

## Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** Supabase (Postgres) — project `nxnfjcqmjjtocgdgeytp`, Sydney region
- **Auth:** Supabase Auth (email/password + email confirmation)
- **Email:** Resend (`noreply@kitlists.app`, `hello@kitlists.app`)
- **Storage:** Supabase Storage (buckets: `logos`, `luts`, `list-files`)
- **Hosting:** Vercel (team: `kitlists`, auto-deploys from `main`)
- **Repo:** `github.com/kitlistsapp/kitlists` (forked from `whitakerleebo/kitlist`)
- **Local dev:** `~/Desktop/kitlist`
- **Domain:** `kitlists.app` / `www.kitlists.app`

---

## Working Pattern — CRITICAL
Lee runs all terminal commands himself. Claude writes exact bash commands in code blocks. Lee copies and pastes them into his terminal.

**Claude never runs commands directly. Always provide exact commands to paste.**

### File editing pattern:
1. Always `cat` the file first before editing
2. Write Python edit scripts to `/tmp/` and run with `python3`
3. Verify with `grep -n` after every edit
4. Never edit files directly without reading them first

### Git workflow:
- Always work on `dev` branch
- Test on localhost before merging to main
- To deploy to production:
```bash
cd ~/Desktop/kitlist && git add -A && git commit -m "Description" && git push origin dev && git checkout main && git merge dev --no-edit && git push origin main && git checkout dev
```
- **Always use `--no-edit` on merge** to avoid vim opening
- Vercel auto-deploys from `main` to `kitlists.app`

### Local dev:
```bash
cd ~/Desktop/kitlist && npm run dev
```
Test at `http://localhost:3000`

---

## Key People
- **Lee Whitaker** — builder, runs terminal, does Supabase SQL, tests locally. UUID: `398198bb`
- **Charlie Whitaker** — primary tester (husband), 1st AC, 23+ years camera dept. UUID: `ecb963a3`
- **Beta users** — real DOPs and 1st ACs now using the live app. Treat `main` as production.

---

## App Structure
```
app/
  page.tsx              — homepage
  dashboard/            — gear list dashboard (DashboardClient.tsx)
  lists/[id]/           — list detail + section pages
    camera/             — camera body section
    power/              — power section (Onboard, Block, AC/DC, Monitor)
    lenses/             — lens browser (miller columns) + zoom controllers
    filtration/         — filtration section
    aks/                — AKS section
    head-tripod/        — head & legs
    grip/               — gimbals
    vtr/                — VTR
  share/[token]/        — public share page (rental house / production view)
  api/
    send-share/         — email share route (Resend)
    send-welcome/       — welcome email route (Resend) — trigger TBD
    invite-collaborator/ — collaboration invite email
    send-contact/       — contact form
    send-feedback/      — feedback form
  auth/callback/        — Supabase auth callback
  profile/              — user profile
  admin/                — internal admin (hidden URL, Charlie only)
```

---

## Key Database Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (full_name, company_name, phone, role, logo) |
| `gear_lists` | Lists (project_name, status: draft/sent/archived) |
| `camera_pages` | Camera bodies per list |
| `list_items` | All section items (power, filtration, aks, head_tripod, grip, vtr, zoom_controllers) — `section` column |
| `list_lenses` | Lenses saved to a list (links to `lens_library`) |
| `lens_library` | 4,290+ lens database (manufacturer, category, sub_category, lens_name) |
| `list_shares` | Share tokens (view_mode: full / production_clean) |
| `list_collaborators` | Collaboration invites |
| `list_section_notes` | Notes per section per list |
| `shoot_specs` | Shoot specifications |
| `list_lut_files` | LUT files attached to lists |
| `equipment_items` | Equipment database (power, filtration, aks, zoom_controllers etc) |
| `rental_houses` | Rental house contacts |
| `contacts` | 1st AC contacts per user |

---

## Key Conventions
- **Commission/figures:** All inc. super; payroll applies ÷1.12 separately (Sirius only, not KitLists)
- **Lens display format:** `Manufacturer · Category · lens_name` (manufacturer stripped from lens_name in lens_library)
- **Ownership badges:** Rental (default), DOP owned (#FFE135 yellow), AC owned (blue)
- **View modes:** `full` = shows ownership badges; `production_clean` = shows "Supplied" only
- **Power section prefixes:** Onboard —, Monitor — stored as `custom_label` on save
- **AKS section prefixes:** stored as `custom_label` on save (Onboard —, Focus —)
- **Lens library:** manufacturer stripped from lens_name; display joins `lens_library(manufacturer, category)` at render time
- **list_lenses query:** always `select('*, lens_library(manufacturer, category)')`
- **Dashboard default tab:** Sent (falls back to Draft if no sent lists)

---

## Email Routes
All use Resend with raw HTML (no React Email). Pattern:
```typescript
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({
  from: 'KitLists <noreply@kitlists.app>',
  to: email,
  subject: '...',
  html: `...`
})
```
From addresses: `noreply@kitlists.app` (transactional), `hello@kitlists.app` (marketing)

---

## Share Page (`/share/[token]/page.tsx`)
Sections displayed in order:
1. Camera Body
2. Power (grouped by subcategory)
3. Lenses (grouped by manufacturer)
4. Zoom Controllers
5. Filtration
6. AKS
7. Head & Legs
8. Gimbals
9. VTR
10. Shoot Specs
11. Files / LUTs

`isProduction` flag (from `share.view_mode === 'production_clean'`) hides ownership details.

---

## Instagram
`https://www.instagram.com/kitlists.app` — shown in footer of share page and app.

---

## Outstanding / Active Development
### Bugs to fix:
- Zoom controllers not in share email (only in share preview page — fixed Jun 2026)
- Lens extenders section needed under zoom controllers on lenses page
- UX: move "Add more camera bodies" to list view
- Mags with Camera Body display
- Awaiting Charlie: Canon FDs/K35s lens data, AKS Focus Monitors items
- Welcome email auto-trigger needs Supabase Auth Hook (route exists at `/api/send-welcome`)

### Roadmap:
- DOP camera notes on rental house + 1st AC share only (not production)
- Homepage redirect `kitlists.app` → `/login`
- Auto-archive inactive accounts
- Stripe payment ~$6.99 AUD/month
- CASCADE deletes on user deletion
- Magic link login
- Performance improvements
- Share update notifications (email + highlight changes on preview)
- Profile referral invites
- Custom equipment in profile
- Operator owned as ownership option (alongside DOP/AC)
- Admin page at hidden URL for Charlie to see signups and usage

---

## Environment Variables (local `.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Lens Library Notes
- 4,290+ lenses across 100+ manufacturers
- 3-4 tier structure: Manufacturer → Category → Sub Category → Lens
- Manufacturer name stripped from `lens_name` column (done Jun 2026)
- Display always joins `lens_library(manufacturer, category)` to reconstruct full name
- Some manufacturers still need data cleanup (GL Optics, ZEISS/Whitepoint done)
- ZEISS and Whitepoint Optics use 4-tier structure (need `sub_category`)

---

## Beta Code
`BadBanana99!!` — used on signup page for beta access
