# KitList Session Notes — 13 May 2026

## Completed this session

### Power page
- Qty field now defaults to empty (not 1) on new item add
- Minimum qty of 1 enforced on save with alert

### New section pages created
- `/lists/[id]/head-tripod` — searchable picker, section notes
- `/lists/[id]/grip` — searchable picker, section notes
- `/lists/[id]/filtration` — searchable picker, section notes
- Per-item notes removed from all three (section notes at bottom is sufficient)

### Lenses page
- Section notes block added at bottom
- Focal lengths section renamed to "Focal lengths (approximate)"

### List summary page
- Expandable `<details>` notes toggle on all section cards (Power, Head & Tripod, Grip, Filtration, AKS, Lenses)
- LUT names now shown in Shoot Specs summary line
- Files section description updated to "Attach storyboards and treatments, etc"

### LUT fixes
- Profile page: LUT filenames now saved with extension (e.g. AARON WARM.aml)
- Specs page: same fix for list-level LUT uploads
- LUT delete: FK constraint fix — clears list_lut_files references before deleting user_lut
- Profile page: storage delete made non-blocking so DB delete always runs

### Share / Email / Preview
- Email and preview routes rebuilt to use new list_items structure (not camera_page_items)
- Ownership labels (DOP/AC badges) now appear in full view emails
- Sections now in correct order: Camera Body → Lenses → Power → Head & Tripod → Grip → Filtration → AKS → Shoot Specs
- Section notes included in email per section
- Public share page fully rebuilt with new structure
- LUTs and Files (with download buttons) now only shown for AC/Focus Puller role
- Production and Rental House views hide LUTs and Files

## Still outstanding
- PDF/Excel export — still reading old camera_page_items structure
- Copy job — needs to copy list_items and list_section_notes
- Templates snapshot — needs to include list_items and list_section_notes
- list_misc_items table + /misc route — needs retiring
- Domain crewflow.app — register on Namecheap/Porkbun
- Custom domain on Vercel
- Resend domain verification
- Landing page at /
- Sign out button on dashboard nav
- Film cameras expanded list (Lee to provide)
- Expanded lens database
- More aspect ratio options
- Head & Tripod detailed equipment list (Lee to provide)
