import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { UploadedFile } from '../types'

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void
}

const ACCEPTED_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
  'image/gif': ['.gif'],
  'video/*': ['.mp4', '.webm', '.mov'],
}

function getFileType(file: File): 'image' | 'gif' | 'video' {
  if (file.type === 'image/gif') return 'gif'
  if (file.type.startsWith('video/')) return 'video'
  return 'image'
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadPromises = acceptedFiles.map(async (file) => {
      // Upload file to server
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()

        return {
          id: data.id,
          name: file.name,
          type: getFileType(file),
          url: data.url,
          file,
        } as UploadedFile
      } catch (error) {
        console.error('Upload error:', error)
        // Fallback to local URL if server upload fails
        return {
          id: uuidv4(),
          name: file.name,
          type: getFileType(file),
          url: URL.createObjectURL(file),
          file,
        } as UploadedFile
      }
    })

    const uploadedFiles = await Promise.all(uploadPromises)
    onUpload(uploadedFiles)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        glass-card p-8 cursor-pointer transition-all duration-300
        border-2 border-dashed
        ${isDragActive
          ? 'border-primary-400 bg-primary-900/20 scale-[1.02]'
          : 'border-slate-600 hover:border-slate-500 hover:bg-white/5'
        }
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center text-center">
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
          ${isDragActive ? 'bg-primary-500/20' : 'bg-slate-700/50'}
        `}>
          <svg
            className={`w-8 h-8 transition-colors ${isDragActive ? 'text-primary-400' : 'text-slate-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">
          {isDragActive ? 'Drop your designs here' : 'Upload your designs'}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Drag and drop or click to browse
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 rounded-full">
            Images
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 rounded-full">
            GIFs
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 rounded-full">
            Videos
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Supported: PNG, JPG, WebP, SVG, GIF, MP4, WebM, MOV
        </p>
      </div>
    </div>
  )
}
