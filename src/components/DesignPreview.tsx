import { UploadedFile } from '../types'

interface DesignPreviewProps {
  files: UploadedFile[]
  selectedFile: UploadedFile | null
  onSelect: (file: UploadedFile) => void
  onRemove: (fileId: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

function FileTypeIcon({ type }: { type: 'image' | 'gif' | 'video' }) {
  if (type === 'video') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  if (type === 'gif') {
    return (
      <span className="text-xs font-bold">GIF</span>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

export default function DesignPreview({
  files,
  selectedFile,
  onSelect,
  onRemove,
  onAnalyze,
  isAnalyzing,
}: DesignPreviewProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Your Designs</h2>
        <span className="text-sm text-slate-400">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>

      {/* File Thumbnails */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {files.map((file) => (
          <div
            key={file.id}
            className={`
              relative group aspect-square rounded-xl overflow-hidden cursor-pointer
              border-2 transition-all duration-200
              ${selectedFile?.id === file.id
                ? 'border-primary-500 ring-2 ring-primary-500/30'
                : 'border-transparent hover:border-slate-600'
              }
            `}
            onClick={() => onSelect(file)}
          >
            {file.type === 'video' ? (
              <video
                src={file.url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            )}

            {/* Type Badge */}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-white">
              <FileTypeIcon type={file.type} />
            </div>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(file.id)
              }}
              className="absolute top-1 right-1 p-1 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Selected Preview */}
      {selectedFile && (
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-2">Selected: {selectedFile.name}</p>
          <div className="relative rounded-xl overflow-hidden bg-slate-800/50 aspect-video">
            {selectedFile.type === 'video' ? (
              <video
                src={selectedFile.url}
                className="w-full h-full object-contain"
                controls
                muted
              />
            ) : (
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={onAnalyze}
        disabled={!selectedFile || isAnalyzing}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing Design...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate Prompt
          </>
        )}
      </button>
    </div>
  )
}
