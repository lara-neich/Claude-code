export interface Quote {
  id: string
  text: string
  participantName: string
  transcriptId: string
  timestamp: string
}

export interface ConfidencePoint {
  interview: string
  confidence: number
}

export interface KeyLearning {
  id: string
  title: string
  confidence: number
  tags: string[]
  why: string[]
  achievedObjectives: string[]
  followUpQuestions: string[]
  confidenceOverTime: ConfidencePoint[]
  quotes: Quote[]
}

export interface CheckableItem {
  id: string
  text: string
  checked: boolean
}

export interface Study {
  name: string
  participantFilter: string
  goals: CheckableItem[]
  learningObjectives: CheckableItem[]
  nextSteps: CheckableItem[]
  keyLearnings: KeyLearning[]
}
