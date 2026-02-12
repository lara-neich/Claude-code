import type { Study, Quote, KeyLearning } from "../data/types"
import { mockStudy } from "../data/mockData"

const USE_MOCK_DATA = true
const _AIRTABLE_API_KEY = "your_api_key_here"
const _AIRTABLE_BASE_ID = "your_base_id_here"

// Keep a mutable copy for mock mode
let studyData: Study = JSON.parse(JSON.stringify(mockStudy))

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(): Promise<void> {
  return delay(200 + Math.random() * 100)
}

// ---------------------------------------------------------------------------
// Study
// ---------------------------------------------------------------------------

export async function getStudy(): Promise<Study> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    return JSON.parse(JSON.stringify(studyData))
  }
  throw new Error("Airtable integration not configured")
}

export async function updateStudy(
  fields: Partial<{ name: string; participantFilter: string; totalParticipants: number }>
): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    if (fields.name !== undefined) studyData.name = fields.name
    if (fields.participantFilter !== undefined) studyData.participantFilter = fields.participantFilter
    if (fields.totalParticipants !== undefined) studyData.totalParticipants = fields.totalParticipants
    return
  }
  throw new Error("Airtable integration not configured")
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function updateGoal(recordId: string, checked: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const goal = studyData.goals.find((g) => g.id === recordId)
    if (goal) goal.checked = checked
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function addGoal(text: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `g${Date.now()}`
    studyData.goals.push({ id, text, checked: false })
    return id
  }
  throw new Error("Airtable integration not configured")
}

export async function removeGoal(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.goals = studyData.goals.filter((g) => g.id !== recordId)
    return
  }
  throw new Error("Airtable integration not configured")
}

// ---------------------------------------------------------------------------
// Learning Objectives
// ---------------------------------------------------------------------------

export async function updateObjective(recordId: string, checked: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const obj = studyData.learningObjectives.find((o) => o.id === recordId)
    if (obj) obj.checked = checked
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function addObjective(text: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `lo${Date.now()}`
    studyData.learningObjectives.push({ id, text, checked: false })
    return id
  }
  throw new Error("Airtable integration not configured")
}

export async function removeObjective(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.learningObjectives = studyData.learningObjectives.filter((o) => o.id !== recordId)
    return
  }
  throw new Error("Airtable integration not configured")
}

// ---------------------------------------------------------------------------
// Next Steps
// ---------------------------------------------------------------------------

export async function updateNextStep(recordId: string, checked: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const step = studyData.nextSteps.find((s) => s.id === recordId)
    if (step) step.checked = checked
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function addNextStep(text: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `ns${Date.now()}`
    studyData.nextSteps.push({ id, text, checked: false })
    return id
  }
  throw new Error("Airtable integration not configured")
}

export async function removeNextStep(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.nextSteps = studyData.nextSteps.filter((s) => s.id !== recordId)
    return
  }
  throw new Error("Airtable integration not configured")
}

// ---------------------------------------------------------------------------
// Insights (Key Learnings)
// ---------------------------------------------------------------------------

export async function updateInsight(
  recordId: string,
  fields: Partial<{
    title: string
    confidence: number
    tags: string[]
    why: string[]
    achievedObjectives: string[]
    followUpQuestions: string[]
  }>
): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const insight = studyData.keyLearnings.find((k) => k.id === recordId)
    if (insight) {
      if (fields.title !== undefined) insight.title = fields.title
      if (fields.confidence !== undefined) insight.confidence = fields.confidence
      if (fields.tags !== undefined) insight.tags = fields.tags
      if (fields.why !== undefined) insight.why = fields.why
      if (fields.achievedObjectives !== undefined) insight.achievedObjectives = fields.achievedObjectives
      if (fields.followUpQuestions !== undefined) insight.followUpQuestions = fields.followUpQuestions
    }
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function addInsight(insight: Omit<KeyLearning, "id">): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `kl${Date.now()}`
    studyData.keyLearnings.push({ id, ...insight })
    return id
  }
  throw new Error("Airtable integration not configured")
}

export async function removeInsight(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.keyLearnings = studyData.keyLearnings.filter((k) => k.id !== recordId)
    return
  }
  throw new Error("Airtable integration not configured")
}

// ---------------------------------------------------------------------------
// Quotes (nested under an insight)
// ---------------------------------------------------------------------------

export async function addQuote(insightId: string, quote: Omit<Quote, "id">): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const insight = studyData.keyLearnings.find((k) => k.id === insightId)
    if (!insight) throw new Error(`Insight ${insightId} not found`)
    const id = `q${Date.now()}`
    insight.quotes.push({ id, ...quote })
    return id
  }
  throw new Error("Airtable integration not configured")
}

export async function removeQuote(insightId: string, quoteId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const insight = studyData.keyLearnings.find((k) => k.id === insightId)
    if (insight) {
      insight.quotes = insight.quotes.filter((q) => q.id !== quoteId)
    }
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function updateQuote(
  insightId: string,
  quoteId: string,
  fields: Partial<{ text: string; participantName: string; transcriptId: string; timestamp: string }>
): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const insight = studyData.keyLearnings.find((k) => k.id === insightId)
    if (!insight) return
    const quote = insight.quotes.find((q) => q.id === quoteId)
    if (quote) {
      if (fields.text !== undefined) quote.text = fields.text
      if (fields.participantName !== undefined) quote.participantName = fields.participantName
      if (fields.transcriptId !== undefined) quote.transcriptId = fields.transcriptId
      if (fields.timestamp !== undefined) quote.timestamp = fields.timestamp
    }
    return
  }
  throw new Error("Airtable integration not configured")
}

// Suppress unused variable warnings
void _AIRTABLE_API_KEY
void _AIRTABLE_BASE_ID
