# KitLists — Claude/Cowork Handover

## What is KitLists?
KitLists (kitlists.app) is a camera department equipment list platform built for DOPs and 1st ACs in the Australian film/TV industry. Users build gear lists, collaborate with crew, and share with rental houses and production — controlling who sees what (ownership visibility, view mode).

Built by Lee Whitaker (Co-Founder, HACS) and Charlie Whitaker (1st AC, primary tester).

Owned by CrewFlow/KitLists through Bad Banana Films — NOT Hyper Automate. Supabase and Vercel are separate accounts from Lee's Hyper Automate work; never assume connected MCP tools point at KitLists accounts.

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
Lee runs all terminal commands, git operations and Supabase SQL himself. Claude never runs git commands, never deploys, never touches Supabase directly.

**In Cowork sessions (desktop bridge connected):** Claude may write/edit code files directly in `~/Desktop/kitlist` via the device bridge, with Lee's approval. Lee reviews with `git diff`, tests on localhost, and does all commits/merges/deploys himself. Note: Claude's bridge cannot delete files, and running `git status` from the bridge can leave a stale `.git/index.lock` — if git complains, run `rm -f ~/Desktop/kitlist/.git/index.lock`.

**In chat-only sessions:** Claude writes exact bash commands in code blocks for Lee to paste. `cat` files before editing, Python edit scripts to `/tmp/`, verify with `grep -n` after every edit.

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
- **Lee Whitaker** — builder, runs terminal, does Supabase SQL, tests locally. UUID: `398198bb`. Test email: `whitakerleebo@gmail.com`
- **Charlie Whitaker** — primary tester (husband), 1st AC, 23+ years camera dept. UUID: `ecb963a3`. Uses the `/hq` admin panel.
- **Beta users** — real DOPs and 1st ACs now using the live app. Treat `main` as production.

**Current priority: drive adoption over new features.**

---

## App Structure
```
app/
  page.tsx              — homepage (hero + feature sections + phone mockups + CTA, Jul 2026)
  features/             — public "What is it?" sales page (Jul 2026)
  components/
    PhoneMockup.tsx     — CSS phone-frame mockups (PhoneList, PhoneLenses, PhoneShare, PhoneTrio)
    NavBar.tsx / NavBarClient.tsx / Footer.tsx
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
  hq/                   — ADMIN PANEL (Jul 2026) — hidden URL, Charlie + Lee only
    page.tsx            — server gate (ADMIN_EMAILS allowlist → 404 otherwise) + stats via service role
    HQClient.tsx        — Overview / Users / Outreach tabs
  api/
    send-share/         — email share route (Resend)
    send-welcome/       — welcome email route (Resend) — trigger TBD
    invite-collaborator/ — collaboration invite email
    send-contact/       — contact form
    send-feedback/      — feedback form
    hq/outreach/        — admin outreach: GET preview, POST send batch or test (Jul 2026)
  auth/callback/        — Supabase auth callback
  profile/              — user profile
lib/
  supabase/client.ts / server.ts
  supabase/admin.ts     — service-role client + ADMIN_EMAILS allowlist helpers (server only!)
  emails/outreach.ts    — invite + re-engagement email templates (TEMPLATES map)
supabase/
  hq_setup.sql          — outreach_invites table setup (run in Supabase SQL editor)
```

**Middleware:** logged-out visitors may only access `/`, `/login`, `/auth`, `/invite`, `/share`, `/contact-public`, `/about`, `/features`, `/guide`, `/privacy`, `/api/send-welcome`. Any new public page must be added to the allowlist in `middleware.ts`.

---

## Admin Panel (`/hq`) — Jul 2026
- Hidden URL, not linked anywhere in the app. Charlie and Lee sign in with their normal accounts.
- Access: logged-in user's email must be in `ADMIN_EMAILS` env var (comma-separated) — everyone else gets a 404.
- Data is fetched server-side with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — never import `lib/supabase/admin.ts` client-side).
- **Overview tab:** signups (total/week/month/active), gear lists (total/sent/week/share links), adoption (dormant users, invites sent/converted, conversion %).
- **Users tab:** every user with name, email, company, role, joined, last sign-in, list/sent/share counts, ACTIVE/DORMANT badge. Dormant = 0 lists OR no sign-in in 14+ days.
- **Outreach tab:** send invite emails (paste "Name, email" lines) or re-engagement emails (checkbox-pick dormant users). Live preview, **test-send to whitakerleebo@gmail.com first** ([TEST] subject prefix, not recorded). Real sends recorded in `outreach_invites`; history shows who signed up since (conversion tracking for people not in Supabase).
- Sends go from `Charlie at KitLists <hello@kitlists.app>`, paced 600ms apart (Resend 2 req/s limit), max 100 per batch.

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
| `outreach_invites` | Outreach emails sent (email, name, template, sent_by, sent_at) — RLS locked, service-role only (Jul 2026) |

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
From addresses: `noreply@kitlists.app` (transactional), `hello@kitlists.app` (marketing/outreach)

**Outreach templates** live in `lib/emails/outreach.ts`:
- `invite` — for DOPs/ACs not signed up. Charlie's voice, 23-years-on-set angle, 5 feature rows, free-beta hook, CTA to signup.
- `reengage` — for signed-up dormant users. "Account's ready, kit is waiting", 4-step first list, template pitch, feedback ask, CTA to dashboard.
- Always test-send to Lee (`whitakerleebo@gmail.com`) before a real batch.

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

## Marketing Pages (Jul 2026)
- **Homepage (`/`):** hero (unchanged) + "What is it?" yellow nav tab → `/features`, phone-mockup trio, 6-card feature grid, 3-step how-it-works, free-beta CTA band.
- **`/features`:** full sales page — Build / Lens library / Collaborate / Share sections with phone mockups, "who it's for" (DOPs, ACs, rental houses, production), founder credibility, CTAs. Public (in middleware allowlist), has SEO metadata.
- **Phone mockups:** pure CSS in `app/components/PhoneMockup.tsx` — no screenshot assets. Swap for real screenshots later if wanted.
- Logged-out footer links: What is it? / About / Privacy / Instagram.

---

## Instagram
`https://www.instagram.com/kitlists.app` — shown in footer of share page and app.

---

## Outstanding / Active Development
### Bugs to fix:
- Lens extenders section needed under zoom controllers on lenses page
- UX: move "Add more camera bodies" to list view
- Mags with Camera Body display
- Awaiting Charlie: Canon FDs/K35s lens data, AKS Focus Monitors items
- Welcome email auto-trigger needs Supabase Auth Hook (route exists at `/api/send-welcome`)

### Roadmap (adoption first!):
- Send invite batches from DOP lists via /hq outreach (Lee has lists to work through)
- DOP camera notes on rental house + 1st AC share only (not production)
- Auto-archive inactive accounts
- Stripe payment ~$6.99 AUD/month
- CASCADE deletes on user deletion
- Magic link login
- Performance improvements
- Share update notifications (email + highlight changes on preview)
- Profile referral invites
- Custom equipment in profile
- Operator owned as ownership option (alongside DOP/AC)

### Done Jul 2026:
- Homepage feature sections + phone mockups + "What is it?" tab
- `/features` public sales page
- `/hq` admin panel (stats, users, outreach with test-send)
- Invite + re-engagement email templates
- `outreach_invites` table

---

## Environment Variables (local `.env.local` AND Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...   # server-only, used by /hq admin panel
ADMIN_EMAILS=...                # comma-separated login emails allowed into /hq (Charlie + Lee)
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
`BadBanana99!!` — historical beta access code. NOTE (Jul 2026): the live signup form has no beta code field — signup is open. Outreach emails deliberately do not mention a code. If gated signup is wanted again, the field needs re-adding to `/login`.
