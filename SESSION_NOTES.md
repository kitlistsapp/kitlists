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

## UAT Status — ALL DONE except data tables
- Section 1: Profile — billing address, ABN, camera prefs, templates ✅
- Section 2: Dashboard — copy job with equipment, edit job details ✅
- Section 3: Power — blank qty default, Onboard/Block/AC/DC ✅
- Section 4: Head & Tripod — new section (detailed list TBC from Lee) ✅
- Section 5: Grip — new items, UAP-3 renamed ✅
- Section 6: Onboard monitors updated ✅
- Section 7: Wireless Focus Kits renamed, ARRI WCU-4 added ✅
- Section 8: ARRI LMB-4 added to Matte Box ✅
- Section 9: Follow Focus — FF4 only ✅
- Section 10: Zoom Controller renamed, new options ✅
- Section 11: Misc AKS fixes ✅
- Section 12: DOP Owned flag on all equipment ✅
- Mobile optimisation across all pages ✅
- Templates — save from list, use on new list ✅

## Still Outstanding
- D1: Film cameras list (Lee to provide Super 16 + Super 35)
- D2: Expanded lens database
- D3: More aspect ratio options
- 4.2: Head & Tripod detailed equipment list (Lee to provide)
- Domain registration (crewflow.app or similar)
- Custom domain on Vercel
- Resend domain verification
- Landing page at /

## Email
Resend sandbox — sends to whitakerleebo@gmail.com only until domain verified
Fix: change from address in app/api/send-share/route.ts

## Test account
whitakerleebo@gmail.com
