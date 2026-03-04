'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Trash, Upload, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadMedia()
  }, [])

  const loadMedia = async () => {
    const { data } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
    
    setMedia(data || [])
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `media/${fileName}`

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      await supabase.from('media_library').insert({
        filename: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
      })

      loadMedia()
    } catch (error) {
      alert('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, fileUrl) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/media/')
      const filePath = urlParts[1]

      // Delete from storage
      await supabase.storage.from('media').remove([`media/${filePath}`])

      // Delete from database
      await supabase.from('media_library').delete().eq('id', id)

      loadMedia()
    } catch (error) {
      alert('Delete failed: ' + error.message)
    }
  }

  const filteredMedia = media.filter(item =>
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <p className="text-gray-600 mt-2">Manage your uploaded media files</p>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div>
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleUpload}
            accept="image/*,video/*,audio/*,application/pdf"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </label>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((item) => (
          <Card key={item.id} className="p-4 relative group">
            {item.file_type.startsWith('image/') ? (
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                <img
                  src={item.file_url}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-4xl">📄</span>
              </div>
            )}
            <p className="text-sm font-medium truncate mb-1">{item.filename}</p>
            <p className="text-xs text-gray-500">
              {(item.file_size / 1024).toFixed(1)} KB
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(item.id, item.file_url)}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </Card>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No media files found. Upload your first file!</p>
        </div>
      )}
    </div>
  )
}