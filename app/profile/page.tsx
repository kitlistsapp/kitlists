'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Contact { id: string; full_name: string; email: string; phone: string; role: string }
interface Lut { id: string; name: string; file_url: string; notes: string }

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const lutInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [luts, setLuts] = useState<Lut[]>([])
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', role: 'Focus Puller' })
  const [addingContact, setAddingContact] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [newLutName, setNewLutName] = useState('')
  const [newLutNotes, setNewLutNotes] = useState('')
  const [lutUploading, setLutUploading] = useState(false)
  const [camPrefs, setCamPrefs] = useState({ format: '', resolution: '', fps: '', lut: '', aspect_ratio: '' })

  const roles = ['Focus Puller', '2nd AC', 'DIT', 'Gaffer', 'Key Grip', 'Sound Recordist', 'Producer', 'Director', 'Other']

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    setEmail(user.email || '')
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setCompanyName(profile.company_name || '')
      if (profile.camera_preferences) setCamPrefs({ ...camPrefs, ...profile.camera_preferences })
      if (profile.company_logo_url) {
        const { data: signedUrl } = await supabase.storage.from('logos').createSignedUrl(profile.company_logo_url, 3600)
        if (signedUrl) setLogoUrl(signedUrl.signedUrl)
      }
    }
    const { data: ctcts } = await supabase.from('contacts').select('*').eq('owner_id', user.id).order('full_name')
    if (ctcts) setContacts(ctcts)
    const { data: lutsData } = await supabase.from('user_luts').select('*').eq('owner_id', user.id).order('name')
    if (lutsData) setLuts(lutsData)
  }

  const saveProfile = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName, phone, company_name: companyName, camera_preferences: camPrefs }).eq('id', userId)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const uploadLogo = async (file: File) => {
    if (!file || !userId) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = userId + '/logo.' + ext
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (!error) {
      await supabase.from('profiles').update({ company_logo_url: path }).eq('id', userId)
      const { data: signedUrl } = await supabase.storage.from('logos').createSignedUrl(path, 3600)
      if (signedUrl) setLogoUrl(signedUrl.signedUrl)
    }
    setLogoUploading(false)
  }

  const uploadLut = async (file: File) => {
    if (!file || !userId || !newLutName.trim()) return
    setLutUploading(true)
    const ext = file.name.split('.').pop()
    const path = userId + '/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('luts').upload(path, file)
    if (!error) {
      const { data } = await supabase.from('user_luts').insert({ owner_id: userId, name: newLutName.trim(), file_url: path, notes: newLutNotes.trim() }).select().single()
      if (data) setLuts(prev => [...prev, data])
      setNewLutName('')
      setNewLutNotes('')
    }
    setLutUploading(false)
  }

  const deleteLut = async (lut: Lut) => {
    await supabase.storage.from('luts').remove([lut.file_url])
    await supabase.from('user_luts').delete().eq('id', lut.id)
    setLuts(prev => prev.filter(l => l.id !== lut.id))
  }

  const saveContact = async () => {
    if (!newContact.full_name.trim()) return
    setSavingContact(true)
    const { data } = await supabase.from('contacts').insert({ ...newContact, owner_id: userId }).select().single()
    if (data) setContacts(prev => [...prev, data])
    setNewContact({ full_name: '', email: '', phone: '', role: 'Focus Puller' })
    setAddingContact(false)
    setSavingContact(false)
  }

  const deleteContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
    <div>
      <label className="text-zinc-400 text-sm mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm">Back to dashboard</a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h2 className="text-2xl font-bold">Profile</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-5">Your details</h3>
          <div className="flex gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 transition-colors" onClick={() => logoInputRef.current?.click()}>
                {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="text-zinc-600 text-xs text-center px-2">Upload logo</span>}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              {logoUploading && <p className="text-xs text-zinc-500 mt-1">Uploading...</p>}
              {logoUrl && <button onClick={() => logoInputRef.current?.click()} className="text-xs text-zinc-600 hover:text-zinc-400 mt-1 block">Change</button>}
            </div>
            <div className="flex-1 space-y-3">
              <Field label="Full name" value={fullName} onChange={setFullName} placeholder="e.g. Lee Whitaker" />
              <Field label="Company name" value={companyName} onChange={setCompanyName} placeholder="e.g. Hyper Automate" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
              <input type="email" value={email} disabled className="w-full bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed" />
            </div>
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="e.g. 0400 000 000" type="tel" />
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={saveProfile} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save profile'}</button>
            {saved && <span className="text-green-400 text-sm">Saved</span>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-5">Default camera preferences</h3>
          <p className="text-zinc-600 text-xs mb-4">These pre-fill the shoot specs on new lists</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Format', key: 'format', placeholder: 'e.g. ARRIRAW' },
              { label: 'Resolution', key: 'resolution', placeholder: 'e.g. 4.6K' },
              { label: 'Frame rate', key: 'fps', placeholder: 'e.g. 25fps' },
              { label: 'LUT', key: 'lut', placeholder: 'e.g. ARRI LogC3' },
              { label: 'Aspect ratio', key: 'aspect_ratio', placeholder: 'e.g. 2.39:1' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-zinc-500 text-xs mb-1 block">{f.label}</label>
                <input type="text" value={(camPrefs as any)[f.key]} onChange={e => setCamPrefs(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={saveProfile} disabled={saving} className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save preferences'}</button>
            {saved && <span className="text-green-400 text-sm">Saved</span>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-5">My LUTs</h3>
          <div className="space-y-2 mb-4">
            {luts.length === 0 && <p className="text-zinc-600 text-sm">No LUTs saved yet.</p>}
            {luts.map(lut => (
              <div key={lut.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{lut.name}</p>
                  {lut.notes && <p className="text-zinc-500 text-xs mt-0.5">{lut.notes}</p>}
                </div>
                <button onClick={() => deleteLut(lut)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
            ))}
          </div>
          <div className="border border-zinc-700 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">LUT name *</label>
                <input type="text" value={newLutName} onChange={e => setNewLutName(e.target.value)} placeholder="e.g. My Show LUT"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Notes</label>
                <input type="text" value={newLutNotes} onChange={e => setNewLutNotes(e.target.value)} placeholder="e.g. Drama look, ARRI base"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
              </div>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">LUT file (.cube, .3dl, .lut)</label>
              <input ref={lutInputRef} type="file" accept=".cube,.3dl,.lut,.clf"
                onChange={e => e.target.files?.[0] && uploadLut(e.target.files[0])}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm file:mr-3 file:bg-orange-400 file:text-black file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-medium" />
            </div>
            {lutUploading && <p className="text-zinc-500 text-xs">Uploading...</p>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Saved contacts</h3>
            <button onClick={() => setAddingContact(true)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">+ Add contact</button>
          </div>
          {addingContact && (
            <div className="border border-zinc-700 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Name *</label>
                  <input type="text" value={newContact.full_name} onChange={e => setNewContact(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Role</label>
                  <select value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Email</label>
                  <input type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Phone</label>
                  <input type="tel" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="0400 000 000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
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
              <div key={contact.id} className="flex items-start justify-between p-4 bg-zinc-800 rounded-xl">
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