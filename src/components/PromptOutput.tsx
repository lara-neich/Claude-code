import { useState } from 'react'
import { PromptResult, UploadedFile } from '../types'

interface PromptOutputProps {
  result: PromptResult | null
  isAnalyzing: boolean
  error: string | null
  selectedFile: UploadedFile | null
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

export default function PromptOutput({ result, isAnalyzing, error, selectedFile }: PromptOutputProps) {
  const [activeTab, setActiveTab] = useState<'structured' | 'full'>('structured')

  // Empty state
  if (!result && !isAnalyzing && !error) {
    return (
      <div className="glass-card p-8 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No prompt generated yet</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          {selectedFile
            ? 'Click "Generate Prompt" to analyze your design and create a detailed prompt.'
            : 'Upload a design and click "Generate Prompt" to get started.'
          }
        </p>
      </div>
    )
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="glass-card p-8 h-full min-h-[400px] flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-primary-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Analyzing your design</h3>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Our AI is examining colors, composition, typography, and style elements...
        </p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card p-8 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Analysis failed</h3>
        <p className="text-sm text-red-400 max-w-xs">{error}</p>
      </div>
    )
  }

  // Result state
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Generated Prompt</h2>
        <CopyButton text={result!.fullPrompt} label="Copy All" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('structured')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'structured'
              ? 'bg-primary-500/20 text-primary-400'
              : 'bg-slate-700/30 text-slate-400 hover:text-white'
          }`}
        >
          Structured
        </button>
        <button
          onClick={() => setActiveTab('full')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'full'
              ? 'bg-primary-500/20 text-primary-400'
              : 'bg-slate-700/30 text-slate-400 hover:text-white'
          }`}
        >
          Full Prompt
        </button>
      </div>

      {/* Tags */}
      {result!.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {result!.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-primary-300 rounded-full border border-primary-500/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {activeTab === 'structured' ? (
          <>
            {/* Overview */}
            <div className="prompt-section">
              <div className="flex items-center justify-between mb-2">
                <span className="prompt-label">Overview</span>
                <CopyButton text={result!.overview} label="Copy" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result!.overview}</p>
            </div>

            {/* Sections */}
            {result!.sections.map((section, index) => (
              <div key={index} className="prompt-section">
                <div className="flex items-center justify-between mb-2">
                  <span className="prompt-label">{section.label}</span>
                  <CopyButton text={section.content} label="Copy" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
          </>
        ) : (
          <div className="prompt-section">
            <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {result!.fullPrompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
