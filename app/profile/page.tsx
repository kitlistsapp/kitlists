'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Contact { id: string; full_name: string; email: string; phone: string; role: string }
interface Lut { id: string; name: string; file_url: string }
interface Template { id: string; name: string; created_at: string }

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const lutInputRef = useRef<HTMLInputElement>(null)
  const userIdRef = useRef<string>('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [abn, setAbn] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [luts, setLuts] = useState<Lut[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', role: 'Focus Puller' })
  const [addingContact, setAddingContact] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [lutUploading, setLutUploading] = useState(false)
  const [camPrefs, setCamPrefs] = useState<any>({ notes: '' })

  const roles = ['Focus Puller', '2nd AC', 'DIT', 'Gaffer', 'Key Grip', 'Sound Recordist', 'Producer', 'Director', 'Other']

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    userIdRef.current = user.id
    setEmail(user.email || '')
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setFullName(profile.full_name && profile.full_name !== user.email ? profile.full_name : '')
      setPhone(profile.phone || '')
      setCompanyName(profile.company_name || '')
      setBillingAddress(profile.billing_address || '')
      setAbn(profile.abn || '')
      if (profile.camera_preferences) setCamPrefs({ notes: '', ...profile.camera_preferences })
      if (profile.company_logo_url) {
        const { data: signedUrl } = await supabase.storage.from('logos').createSignedUrl(profile.company_logo_url, 3600)
        if (signedUrl) setLogoUrl(signedUrl.signedUrl)
      }
    }
    const [{ data: ctcts }, { data: lutsData }, { data: tmplData }] = await Promise.all([
      supabase.from('contacts').select('*').eq('owner_id', user.id).order('full_name'),
      supabase.from('user_luts').select('*').eq('owner_id', user.id).order('name'),
      supabase.from('templates').select('id, name, created_at').eq('owner_id', user.id).order('name')
    ])
    if (ctcts) setContacts(ctcts)
    if (lutsData) setLuts(lutsData)
    if (tmplData) setTemplates(tmplData)
  }

  const saveProfile = async () => {
    setSaving(true)
    const uid = userIdRef.current || userId
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, phone, company_name: companyName,
      billing_address: billingAddress, abn, camera_preferences: camPrefs
    }).eq('id', uid)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const uploadLogo = async (file: File) => {
    const uid = userIdRef.current || userId
    if (!file || !uid) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = uid + '/logo.' + ext
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (!error) {
      await supabase.from('profiles').update({ company_logo_url: path }).eq('id', uid)
      const { data: signedUrl } = await supabase.storage.from('logos').createSignedUrl(path, 3600)
      if (signedUrl) setLogoUrl(signedUrl.signedUrl)
    }
    setLogoUploading(false)
  }

  const uploadLut = async (file: File) => {
    const uid = userIdRef.current || userId
    if (!file || !uid) return
    setLutUploading(true)
    const lutName = file.name.replace(/\.[^.]+$/, '')
    const ext = file.name.split('.').pop()
    const path = uid + '/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('luts').upload(path, file)
    if (!error) {
      const { data } = await supabase.from('user_luts').insert({ owner_id: uid, name: lutName, file_url: path, notes: '' }).select().single()
      if (data) setLuts(prev => [...prev, data])
    }
    setLutUploading(false)
  }

  const deleteLut = async (lut: Lut) => {
    await supabase.storage.from('luts').remove([lut.file_url])
    await supabase.from('user_luts').delete().eq('id', lut.id)
    setLuts(prev => prev.filter(l => l.id !== lut.id))
  }

  const deleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const saveContact = async () => {
    if (!newContact.full_name.trim()) return
    setSavingContact(true)
    const uid = userIdRef.current || userId
    const { data } = await supabase.from('contacts').insert({ ...newContact, owner_id: uid }).select().single()
    if (data) setContacts(prev => [...prev, data])
    setNewContact({ full_name: '', email: '', phone: '', role: 'Focus Puller' })
    setAddingContact(false)
    setSavingContact(false)
  }

  const deleteContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm">Back to dashboard</a>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold">Profile</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-5">Your details</h3>
          <div className="flex gap-4 mb-5">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 transition-colors" onClick={() => logoInputRef.current?.click()}>
                {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="text-zinc-600 text-xs text-center px-1">Logo</span>}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              {logoUploading && <p className="text-xs text-zinc-500 mt-1">...</p>}
              {logoUrl && <button onClick={() => logoInputRef.current?.click()} className="text-xs text-zinc-600 hover:text-zinc-400 mt-1 block">Change</button>}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Aaron McKlisky ACS" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-zinc-400 text-sm mb-1.5 block">Company name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. McLisky Camera Co" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
              <input type="email" value={email} disabled className="w-full bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-lg px-4 py-2.5 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0400 000 000" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">ABN / Company Number</label>
              <input type="text" value={abn} onChange={e => setAbn(e.target.value)} placeholder="e.g. 12 345 678 901" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Billing address</label>
              <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Street, suburb, state, postcode" rows={2} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={saveProfile} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save profile'}</button>
            {saved && <span className="text-green-400 text-sm">Saved</span>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Camera user preferences</h3>
          <textarea value={camPrefs.notes || ''} onChange={e => setCamPrefs((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Add any personal preferences, notes or defaults you want to remember across jobs..." rows={4} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none" />
          <div className="flex items-center gap-3 mt-4">
            <button onClick={saveProfile} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save preferences'}</button>
            {saved && <span className="text-green-400 text-sm">Saved</span>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Template lists</h3>
          {templates.length === 0 && <p className="text-zinc-600 text-sm mb-4">No templates saved yet. Save a gear list as a template from within the list.</p>}
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Saved {new Date(t.created_at).toLocaleDateString('en-AU')}</p>
                </div>
                <button onClick={() => deleteTemplate(t.id)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">My LUTs</h3>
          <div className="space-y-2 mb-4">
            {luts.length === 0 && <p className="text-zinc-600 text-sm">No LUTs saved yet.</p>}
            {luts.map(lut => (
              <div key={lut.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                <p className="text-white text-sm font-medium">{lut.name}</p>
                <button onClick={() => deleteLut(lut)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
            ))}
          </div>
          <div className="border border-zinc-700 rounded-xl p-4">
            <label className="text-zinc-500 text-xs mb-2 block">Upload LUT file — filename becomes the LUT name</label>
            <input ref={lutInputRef} type="file" accept=".cube,.3dl,.lut,.clf,.aml,.alf4" onChange={e => e.target.files?.[0] && uploadLut(e.target.files[0])} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm file:mr-3 file:bg-orange-400 file:text-black file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-medium" />
            {lutUploading && <p className="text-zinc-500 text-xs mt-2">Uploading...</p>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Saved contacts</h3>
            <button onClick={() => setAddingContact(true)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">+ Add contact</button>
          </div>
          {addingContact && (
            <div className="border border-zinc-700 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Name *</label>
                  <input type="text" value={newContact.full_name} onChange={e => setNewContact(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Role</label>
                  <select value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Email</label>
                  <input type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Phone</label>
                  <input type="tel" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="0400 000 000" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveContact} disabled={savingContact} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50">{savingContact ? 'Saving...' : 'Save contact'}</button>
                <button onClick={() => setAddingContact(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
          {contacts.length === 0 && !addingContact && <p className="text-zinc-600 text-sm">No contacts saved yet.</p>}
          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className="flex items-start justify-between p-3 bg-zinc-800 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{contact.full_name}</span>
                    <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{contact.role}</span>
                  </div>
                  {contact.email && <p className="text-zinc-500 text-xs mt-1">{contact.email}</p>}
                  {contact.phone && <p className="text-zinc-500 text-xs">{contact.phone}</p>}
                </div>
                <button onClick={() => deleteContact(contact.id)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}