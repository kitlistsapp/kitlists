'use client'

import { useParams, useRouter } from 'next/navigation'
import LensBrowser from '../../components/LensBrowser'
import { createClient } from '../../utils/supabase/client'

type SelectedLens = {
  category: string
  manufacturer: string
  series: string
  focalLength: string
}

export default function LensesPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string

  const handleSave = async (selected: SelectedLens[]) => {
    if (!selected.length) return
    const supabase = createClient()

    const rows = selected.map((lens, i) => ({
      list_id: listId,
      category: lens.category,
      manufacturer: lens.manufacturer,
      series: lens.series,
      focal_length: lens.focalLength,
      sort_order: i,
    }))

    const { error } = await supabase.from('list_lenses').insert(rows)

    if (error) {
      console.error('Failed to save lenses:', error)
      return
    }

    router.push(`/lists/${listId}`)
  }

  return (
    <div className="h-screen bg-black">
      <LensBrowser listId={listId} onSave={handleSave} />
    </div>
  )
}
