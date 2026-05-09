'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function NewListPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [projectName, setProjectName] = useState("")
  const [productionCo, setProductionCo] = useState("")
  const [shootStart, setShootStart] = useState("")
  const [shootDays, setShootDays] = useState("1")
  const [numCameras, setNumCameras] = useState("1")
  const [houseId, setHouseId] = useState("")
  const [rentalHouses, setRentalHouses] = useState<any[]>([])

  const cameraLabels = ["A cam", "B cam", "C cam", "D cam", "E cam", "F cam"]

  useEffect(() => {
    const supabase2 = createClient()
    supabase2.from('rental_houses').select('*').order('name').then(({ data }) => { if (data) setRentalHouses(data) })
  }, [])

  const handleCreate = async () => {
    if (!projectName.trim()) { setError("Project name is required"); return }
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: list, error: listError } = await supabase
      .from("gear_lists")
      .insert({
        owner_id: user.id,
        project_name: projectName.trim(),
        house_id: houseId || null,
        production_co: productionCo.trim(),
        shoot_start: shootStart || null,
        shoot_days: parseInt(shootDays),
        status: "draft"
      })
      .select()
      .single()

    if (listError || !list) { setError(listError?.message || "Failed to create list"); setLoading(false); return }

    const cameras = Array.from({ length: parseInt(numCameras) }, (_, i) => ({
      list_id: list.id,
      label: cameraLabels[i],
      sort_order: i
    }))

    await supabase.from("camera_pages").insert(cameras)

    router.push(`/lists/${list.id}`)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold">
          Kit<span className="text-orange-400">List</span>
        </a>
        <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors">
          Back to dashboard
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">New Gear List</h2>
          <p className="text-zinc-500 text-sm mt-1">Set up your project details to get started</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Project name <span className="text-orange-400">*</span></label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Heartbreak High S3"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Production company</label>
            <input
              type="text"
              value={productionCo}
              onChange={e => setProductionCo(e.target.value)}
              placeholder="e.g. Fremantle Australia"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Shoot start date</label>
              <input
                type="date"
                value={shootStart}
                onChange={e => setShootStart(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Number of shoot days</label>
              <input
                type="number"
                min="1"
                value={shootDays}
                onChange={e => setShootDays(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Rental house</label>
            <select value={houseId} onChange={e => setHouseId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors">
              <option value="">Select rental house (optional)</option>
              {rentalHouses.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}{h.city ? ` — ${h.city}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Number of cameras</label>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5,6].map(n => (
                <button
                  key={n}
                  onClick={() => setNumCameras(String(n))}
                  className={`w-12 h-12 rounded-lg text-sm font-semibold transition-colors ${
                    numCameras === String(n)
                      ? "bg-orange-400 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs mt-2">
              Creates: {Array.from({ length: parseInt(numCameras) }, (_, i) => cameraLabels[i]).join(", ")}
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-orange-400 hover:bg-orange-300 text-black font-semibold rounded-lg py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create gear list"}
          </button>
        </div>
      </main>
    </div>
  )
}
