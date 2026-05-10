# KitList — Session Notes
Last updated: 10 May 2026

## Live URL
https://kitlist-theta.vercel.app

## Stack
Next.js 16, Supabase (pzydgyqykcgdcikutzpg / Oceania Sydney), Tailwind, jsPDF + SheetJS, Vercel, Resend
Repo: github.com/whitakerleebo/kitlist

## Environment Variables (Vercel)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL = https://kitlist-theta.vercel.app
RESEND_API_KEY

## Pages
- /login — email/password auth
- /dashboard — status tabs, archive/copy/delete, share indicator, light/dark mode
- /profile — name, logo, phone, company, user prefs, LUT upload, saved contacts
- /lists/new — project info, rental house selector, camera count
- /lists/[id] — summary with orange dot status, expandable sections
- /lists/[id]/camera/[cameraId] — digital/film, power, grip, AKS, filtration
- /lists/[id]/lenses — brand > lens two-step picker, focal lengths, zooms, controller
- /lists/[id]/misc — checklist with per-item notes and source
- /lists/[id]/specs — format/codec, resolution, fps, aspect ratio, multi-LUT, notes
- /lists/[id]/share — generate share links, role/view mode, send email, click row to open
- /lists/[id]/files — file attachments upload/download
- /share/[token] — read-only view, DOP branding, PDF + Excel download, LUT download

## Email
Resend sandbox mode — can only send to whitakerleebo@gmail.com until domain verified
Once crewflow.app (or similar) registered:
- Add domain to Resend
- Change from: address in app/api/send-share/route.ts from onboarding@resend.dev to noreply@crewflow.app

## Outstanding / Backlog
- [ ] Film camera list — Lee to provide
- [ ] Light mode on all pages (currently dashboard only)
- [ ] List summary — update for multi-lens format (shows first prime only)
- [ ] Templates — save a list as a template, reuse on future jobs
- [ ] Rental house export format (Current RMS / Rentman)
- [ ] Domain registration — crewflow.app on Namecheap/Porkbun
- [ ] Custom domain on Vercel once registered
- [ ] Resend domain verification once domain registered

## Test account
whitakerleebo@gmail.com
Test list: TKMax (2112f6a7-2c3b-4534-91f9-3f17a2f4218b)
