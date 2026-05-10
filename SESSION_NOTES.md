# KitList — Session Notes
Last updated: 10 May 2026

## Live URL
https://kitlist-theta.vercel.app

## Start command (fresh Terminal)
source ~/.zshrc && cd ~/Desktop/kitlist && npm run dev
Then go to: http://localhost:3000/dashboard

## Stack
Next.js 16, Supabase (pzydgyqykcgdcikutzpg / Oceania Sydney), Tailwind, jsPDF + SheetJS, Vercel, Resend
Repo: github.com/whitakerleebo/kitlist

## Environment Variables (Vercel)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL = https://kitlist-theta.vercel.app
RESEND_API_KEY

## Test accounts
- whitakerleebo@gmail.com (Aaron McKlisky / Aaron M Pty Ltd)
- lee@hyperautomate.com.au (Joel Mc / Joel Mc DOP Pty Ltd)

## All UAT Complete ✅
- Sections 1-12 from UAT brief all done
- Mobile optimisation across all pages
- Templates (save from list, use on new list)
- DOP owned + AC owned flags on all equipment
- AC owned shows to rental house + focus puller, hidden from production clean view
- Dashboard server-side fetch (fast load)
- Email preview modal on share page
- Signup captures name, phone, company
- Signup → sign in flow automatic
- DOP logo + company name in dashboard nav
- LUT upload uses original filename
- Film cameras: ARRI 435, ARRI 416 added

## Outstanding / Backlog
- D1: Film cameras expanded list (Lee to provide Super 16 + Super 35)
- D2: Expanded lens database
- D3: More aspect ratio options
- 4.2: Head & Tripod detailed equipment list (Lee to provide)
- Domain registration (crewflow.app or similar on Namecheap/Porkbun)
- Custom domain on Vercel once registered
- Resend domain verification (change from: onboarding@resend.dev to noreply@crewflow.app in app/api/send-share/route.ts)
- Landing page at /
- Sign out button on dashboard (currently only theme toggle + name showing)

## Email
Resend sandbox — sends to whitakerleebo@gmail.com only until domain verified
Fix when domain ready: change from address in app/api/send-share/route.ts

## Key architecture notes
- Supabase email confirmation: DISABLED (Authentication → Providers → Email)
- All storage buckets: private (logos, luts, list-files)
- Source values: rental | dop_owned | ac_owned
- Camera page items constraint allows: power, aks, grip, filtration, head_tripod
