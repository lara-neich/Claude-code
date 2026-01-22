export interface UploadedFile {
  id: string
  name: string
  type: 'image' | 'gif' | 'video'
  url: string
  file: File
}

export interface PromptSection {
  label: string
  content: string
}

export interface PromptResult {
  overview: string
  sections: PromptSection[]
  fullPrompt: string
  tags: string[]
}
