'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Contact { id: string; full_name: string; email: string; phone: string; role: string }

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', role: 'Focus Puller' })
  const [addingContact, setAddingContact] = useState(false)
  const [savingContact, setSavingContact] = useState(false)

  const roles = ['Focus Puller', '2nd AC', 'DIT', 'Gaffer', 'Key Grip', 'Sound Recordist', 'Producer', 'Director', 'Other']

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setEmail(user.email || '')
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setCompanyName(profile.company_name || '')
    }
    const { data: ctcts } = await supabase.from('contacts').select('*').eq('owner_id', user.id).order('full_name')
    if (ctcts) setContacts(ctcts)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: fullName, phone, company_name: companyName }).eq('id', user.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const saveContact = async () => {
    if (!newContact.full_name.trim()) return
    setSavingContact(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('contacts').insert({ ...newContact, owner_id: user.id }).select().single()
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
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-orange-400">List</span></a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm">Back to dashboard</a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">Profile</h2>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-5">Your details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Aaron McLisky ACS"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
              <input type="email" value={email} disabled
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0400 000 000"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Company name</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. McLisky Camera Co"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button onClick={saveProfile} disabled={saving}
              className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
            {saved && <span className="text-green-400 text-sm">Saved</span>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Saved contacts</h3>
            <button onClick={() => setAddingContact(true)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
              + Add contact
            </button>
          </div>

          {addingContact && (
            <div className="border border-zinc-700 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Name *</label>
                  <input type="text" value={newContact.full_name} onChange={e => setNewContact(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Full name"
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
                  <input type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1 block">Phone</label>
                  <input type="tel" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0400 000 000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveContact} disabled={savingContact}
                  className="bg-orange-400 hover:bg-orange-300 text-black font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                  {savingContact ? 'Saving...' : 'Save contact'}
                </button>
                <button onClick={() => setAddingContact(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {contacts.length === 0 && !addingContact && (
            <p className="text-zinc-600 text-sm">No contacts saved yet. Add your focus puller, gaffer, or other regular crew.</p>
          )}

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
                <button onClick={() => deleteContact(contact.id)}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}