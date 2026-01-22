import { useState } from 'react'
import FileUpload from './components/FileUpload'
import DesignPreview from './components/DesignPreview'
import PromptOutput from './components/PromptOutput'
import Header from './components/Header'
import { UploadedFile, PromptResult } from './types'

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [promptResult, setPromptResult] = useState<PromptResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files])
    if (!selectedFile && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)
    setPromptResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: selectedFile.id,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze design')
      }

      const result = await response.json()
      setPromptResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFile?.id === fileId) {
      setSelectedFile(uploadedFiles.find(f => f.id !== fileId) || null)
      setPromptResult(null)
    }
  }

  return (
    <div className="min-h-screen pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Preview */}
          <div className="space-y-6">
            <FileUpload onUpload={handleFileUpload} />

            {uploadedFiles.length > 0 && (
              <DesignPreview
                files={uploadedFiles}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
                onRemove={handleRemoveFile}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            )}
          </div>

          {/* Right Column - Prompt Output */}
          <div>
            <PromptOutput
              result={promptResult}
              isAnalyzing={isAnalyzing}
              error={error}
              selectedFile={selectedFile}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
