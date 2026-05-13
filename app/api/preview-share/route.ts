import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { listId, dopName, companyName, token } = await request.json()
  const supabase = await createClient()
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`

  const { data: list } = await supabase.from('gear_lists').select('*, rental_houses(name)').eq('id', listId).single()
  const { data: cameras } = await supabase.from('camera_pages').select('*, equipment_items(name)').eq('list_id', listId).order('sort_order')
  const { data: lenses } = await supabase.from('list_lenses').select('*, equipment_items(name), list_lens_zooms(*, equipment_items(name))').eq('list_id', listId).maybeSingle()
  const { data: listItems } = await supabase.from('list_items').select('*, equipment_items(name, subcategory, category)').eq('list_id', listId).order('sort_order')
  const { data: sectionNotes } = await supabase.from('list_section_notes').select('*').eq('list_id', listId)
  const { data: specs } = await supabase.from('shoot_specs').select('*').eq('list_id', listId).maybeSingle()
  const { data: listLuts } = await supabase.from('list_lut_files').select('*').eq('list_id', listId)

  const powerItems = (listItems || []).filter((i: any) => i.section === 'power')
  const headTripodItems = (listItems || []).filter((i: any) => i.section === 'head_tripod')
  const gripItems = (listItems || []).filter((i: any) => i.section === 'grip')
  const filtrationItems = (listItems || []).filter((i: any) => i.section === 'filtration')
  const aksItems = (listItems || []).filter((i: any) => i.section === 'aks')
  const getSectionNote = (section: string) => (sectionNotes || []).find((n: any) => n.section === section)?.notes || ''

  const ownerLabel = (source: string, viewMode: string) => {
    if (viewMode !== 'full') return ''
    if (source === 'dop_owned') return ' <span style="background:#431407;color:#fb923c;font-size:10px;padding:1px 6px;border-radius:10px;font-weight:bold;">DOP</span>'
    if (source === 'ac_owned') return ' <span style="background:#1e3a5f;color:#60a5fa;font-size:10px;padding:1px 6px;border-radius:10px;font-weight:bold;">AC</span>'
    return ''
  }

  const formatItems = (items: any[], viewMode: string, showQty = true) =>
    items.map((i: any) => `${i.equipment_items?.name || i.custom_label}${showQty && i.quantity > 1 ? ' x' + i.quantity : ''}${ownerLabel(i.source, viewMode)}`).join('<br>')

  const row = (label: string, value: string) => value ? `
    <tr>
      <td style='padding: 8px 12px; color: #71717a; font-size: 13px; white-space: nowrap; vertical-align: top; width: 180px;'>${label}</td>
      <td style='padding: 8px 12px; color: #ffffff; font-size: 13px;'>${value}</td>
    </tr>` : ''

  const sectionHeader = (title: string) => `
    <tr>
      <td colspan='2' style='padding: 16px 12px 4px; color: #fb923c; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; border-top: 1px solid #27272a;'>${title}</td>
    </tr>`

  let tableRows = ''
  const viewMode = 'full'

  tableRows += row('Project', list?.project_name || '')
  tableRows += row('Production Co', list?.production_co || '')
  tableRows += row('Shoot Start', list?.shoot_start ? new Date(list.shoot_start).toLocaleDateString('en-AU') : '')
  tableRows += row('Shoot Days', list?.shoot_days ? String(list.shoot_days) : '')
  tableRows += row('Rental House', list?.rental_houses?.name || '')

  for (const cam of (cameras || [])) {
    const bodyName = cam.equipment_items?.name
    if (!bodyName) continue
    tableRows += sectionHeader(cam.label)
    tableRows += row('Camera Body', bodyName + ownerLabel(cam.camera_body_source, viewMode))
    if (cam.camera_notes) tableRows += row('Notes', cam.camera_notes)
  }

  if (powerItems.length > 0) {
    tableRows += sectionHeader('Power')
    tableRows += row('Items', formatItems(powerItems, viewMode))
    const pNote = getSectionNote('power')
    if (pNote) tableRows += row('Notes', pNote)
  }

  if (headTripodItems.length > 0) {
    tableRows += sectionHeader('Head & Tripod')
    tableRows += row('Items', formatItems(headTripodItems, viewMode))
    const htNote = getSectionNote('head_tripod')
    if (htNote) tableRows += row('Notes', htNote)
  }

  if (gripItems.length > 0) {
    tableRows += sectionHeader('Grip')
    tableRows += row('Items', formatItems(gripItems, viewMode))
    const gNote = getSectionNote('grip')
    if (gNote) tableRows += row('Notes', gNote)
  }

  if (filtrationItems.length > 0) {
    tableRows += sectionHeader('Filtration')
    tableRows += row('Items', formatItems(filtrationItems, viewMode, false))
    const fNote = getSectionNote('filtration')
    if (fNote) tableRows += row('Notes', fNote)
  }

  if (aksItems.length > 0) {
    tableRows += sectionHeader('AKS')
    tableRows += row('Items', formatItems(aksItems, viewMode))
    const aNote = getSectionNote('aks')
    if (aNote) tableRows += row('Notes', aNote)
  }

  if (lenses) {
    tableRows += sectionHeader('Lenses')
    if (lenses.equipment_items?.name) tableRows += row('Prime Set', lenses.equipment_items.name)
    if (lenses.focal_lengths?.length > 0) tableRows += row('Focal Lengths (approx)', lenses.focal_lengths.join(', '))
    if (lenses.list_lens_zooms?.length > 0) tableRows += row('Zooms', lenses.list_lens_zooms.map((z: any) => z.equipment_items?.name).filter(Boolean).join('<br>'))
    if (lenses.zoom_controller) tableRows += row('Controller', lenses.zoom_controller)
    const lNote = getSectionNote('lenses')
    if (lNote) tableRows += row('Notes', lNote)
  }

  if (specs) {
    tableRows += sectionHeader('Shoot Specs')
    if (specs.format) tableRows += row('Format / Codec', specs.format)
    if (specs.resolution) tableRows += row('Resolution', specs.resolution)
    if (specs.fps) tableRows += row('Frame Rate', specs.fps)
    if (specs.aspect_ratio) tableRows += row('Aspect Ratio', specs.aspect_ratio)
    if (listLuts && listLuts.length > 0) tableRows += row('LUT(s)', listLuts.map((l: any) => l.name).join('<br>') + '<br><span style="color:#71717a;font-size:11px;">Download from the link below</span>')
    if (specs.job_notes) tableRows += row('Notes', specs.job_notes)
  }

  const html = `
    <div style='font-family: helvetica, arial, sans-serif; max-width: 640px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px;'>
      <h1 style='font-size: 22px; font-weight: bold; margin: 0 0 4px;'>Kit<span style='color: #fb923c;'>List</span></h1>
      <p style='color: #71717a; font-size: 11px; margin: 0 0 24px; letter-spacing: 0.1em; text-transform: uppercase;'>Camera Equipment Platform</p>
      <hr style='border: none; border-top: 1px solid #27272a; margin: 0 0 24px;' />
      <p style='color: #a1a1aa; font-size: 13px; margin: 0 0 4px;'>${dopName}${companyName ? ' &middot; ' + companyName : ''} has sent you a gear list.</p>
      <table style='width: 100%; border-collapse: collapse; margin: 16px 0 24px;'>
        <tbody>${tableRows}</tbody>
      </table>
      <a href='${shareUrl}' style='display: inline-block; background: #fb923c; color: #000; font-weight: bold; font-size: 13px; padding: 12px 24px; border-radius: 8px; text-decoration: none;'>View online</a>
      <hr style='border: none; border-top: 1px solid #27272a; margin: 32px 0 16px;' />
      <p style='color: #3f3f46; font-size: 11px; margin: 0;'>Powered by KitList</p>
    </div>
  `

  return NextResponse.json({ html })
}
