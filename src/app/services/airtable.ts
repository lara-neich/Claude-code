import type { Study } from "../data/types"
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

export async function getStudy(): Promise<Study> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    return JSON.parse(JSON.stringify(studyData))
  }
  // Real Airtable implementation would go here
  // const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Studies/${studyId}`, {
  //   headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  // })
  throw new Error("Airtable integration not configured")
}

export async function updateGoal(recordId: string, checked: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const goal = studyData.goals.find((g) => g.id === recordId)
    if (goal) goal.checked = checked
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function updateObjective(recordId: string, checked: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const obj = studyData.learningObjectives.find((o) => o.id === recordId)
    if (obj) obj.checked = checked
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function updateNextStep(recordId: string, checked: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const step = studyData.nextSteps.find((s) => s.id === recordId)
    if (step) step.checked = checked
    return
  }
  throw new Error("Airtable integration not configured")
}

export async function updateInsight(
  recordId: string,
  fields: Partial<{ title: string; confidence: number; tags: string[] }>
): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const insight = studyData.keyLearnings.find((k) => k.id === recordId)
    if (insight) {
      if (fields.title !== undefined) insight.title = fields.title
      if (fields.confidence !== undefined) insight.confidence = fields.confidence
      if (fields.tags !== undefined) insight.tags = fields.tags
    }
    return
  }
  throw new Error("Airtable integration not configured")
}

// Suppress unused variable warnings
void _AIRTABLE_API_KEY
void _AIRTABLE_BASE_ID
