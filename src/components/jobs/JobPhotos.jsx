import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useBusiness } from '../../hooks/useBusiness.jsx'

const PHOTO_TYPES = [
  { value: 'before', label: 'Before' },
  { value: 'progress', label: 'Progress' },
  { value: 'after', label: 'After' },
  { value: 'site_condition', label: 'Site condition' },
  { value: 'issue', label: 'Issue' },
  { value: 'other', label: 'Other' }
]

export default function JobPhotos({ jobId }) {
  const { business } = useBusiness()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  const load = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    const { data } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('taken_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }, [jobId])

  useEffect(() => { load() }, [load])

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !business) return
    setUploading(true)
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${business.id}/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('job-photos')
          .upload(path, file, { contentType: file.type })
        if (uploadErr) {
          console.error('Upload error:', uploadErr)
          continue
        }
        const { data: urlData } = supabase.storage
          .from('job-photos')
          .getPublicUrl(path)
        // job-photos is private, so use signed URL instead
        const { data: signed } = await supabase.storage
          .from('job-photos')
          .createSignedUrl(path, 60 * 60 * 24 * 365) // 1yr

        const url = signed?.signedUrl || urlData?.publicUrl || ''
        await supabase.from('job_photos').insert({
          job_id: jobId,
          business_id: business.id,
          storage_path: path,
          url,
          photo_type: 'other'
        })
      }
      await load()
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deletePhoto(photo) {
    await supabase.storage.from('job-photos').remove([photo.storage_path])
    await supabase.from('job_photos').delete().eq('id', photo.id)
    setPhotos((cur) => cur.filter((p) => p.id !== photo.id))
    if (preview?.id === photo.id) setPreview(null)
  }

  async function updateType(photoId, newType) {
    await supabase.from('job_photos').update({ photo_type: newType }).eq('id', photoId)
    setPhotos((cur) => cur.map((p) => (p.id === photoId ? { ...p, photo_type: newType } : p)))
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Photos</h2>
        <label className={`btn-secondary !py-2 !px-3 !min-h-0 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Camera className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Add'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-slate-500">No photos yet. Tap Add to capture.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreview(p)}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-100"
            >
              <img
                src={p.url}
                alt={p.photo_type}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 text-center capitalize">
                {p.photo_type.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <header className="flex items-center justify-between p-3 shrink-0">
            <select
              value={preview.photo_type}
              onChange={(e) => {
                updateType(preview.id, e.target.value)
                setPreview({ ...preview, photo_type: e.target.value })
              }}
              className="bg-white/10 text-white text-sm rounded-lg px-2 py-1.5 border border-white/20"
            >
              {PHOTO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => deletePhoto(preview)}
                className="text-red-400 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setPreview(null)} className="text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={preview.url}
              alt={preview.photo_type}
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </section>
  )
}
