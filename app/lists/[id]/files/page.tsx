'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ListFile { id: string; name: string; file_path: string; file_size: number; mime_type: string; created_at: string }

export default function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [listId, setListId] = useState('')
  const [userId, setUserId] = useState('')
  const [files, setFiles] = useState<ListFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    params.then(p => { setListId(p.id); loadFiles(p.id) })
  }, [])

  const loadFiles = async (lid: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data } = await supabase.from('list_files').select('*').eq('list_id', lid).order('created_at')
    if (data) {
      setFiles(data)
      const urls: Record<string, string> = {}
      for (const f of data) {
        const { data: signed } = await supabase.storage.from('list-files').createSignedUrl(f.file_path, 3600)
        if (signed) urls[f.id] = signed.signedUrl
      }
      setSignedUrls(urls)
    }
  }

  const uploadFile = async (file: File) => {
    if (!file || !userId || !listId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = userId + '/' + listId + '/' + Date.now() + '-' + file.name
    const { error } = await supabase.storage.from('list-files').upload(path, file)
    if (!error) {
      const { data } = await supabase.from('list_files').insert({
        list_id: listId,
        owner_id: userId,
        name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type
      }).select().single()
      if (data) {
        setFiles(prev => [...prev, data])
        const { data: signed } = await supabase.storage.from('list-files').createSignedUrl(path, 3600)
        if (signed) setSignedUrls(prev => ({ ...prev, [data.id]: signed.signedUrl }))
      }
    }
    setUploading(false)
  }

  const deleteFile = async (file: ListFile) => {
    await supabase.storage.from('list-files').remove([file.file_path])
    await supabase.from('list_files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">Kit<span className="text-[#FFE135]">Lists</span></a>
        <a href={`/lists/${listId}`} className="text-zinc-400 hover:text-white text-sm">Back to list</a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Files</h2>
        <p className="text-zinc-500 text-sm mb-8">Attach storyboards and treatments, etc</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="space-y-3 mb-6">
            {files.length === 0 && <p className="text-zinc-600 text-sm">No files attached yet.</p>}
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{file.name}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{formatSize(file.file_size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {signedUrls[file.id] && (
                    <a href={signedUrls[file.id]} download={file.name}
                      className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                      Download
                    </a>
                  )}
                  <button onClick={() => deleteFile(file)}
                    className="text-zinc-600 hover:text-red-400 text-xs transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-5">
            <input ref={fileInputRef} type="file" className="hidden" multiple
              onChange={async e => {
                if (e.target.files) {
                  for (const file of Array.from(e.target.files)) {
                    await uploadFile(file)
                  }
                }
              }}
            />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full border border-dashed border-zinc-700 hover:border-[#FFE135] rounded-xl py-8 text-zinc-500 hover:text-[#FFE135] transition-colors text-sm">
              {uploading ? 'Uploading...' : '+ Click to upload files (or drag and drop)'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <a href={"/lists/" + listId + "/specs"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            ← Shoot Specs
          </a>
          <a href={"/lists/" + listId + "/other-kit"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFE135] hover:bg-[#FFD700] text-black text-sm font-semibold transition-colors">
            Other Kit →
          </a>
        </div>
      </main>
    </div>
  )
}