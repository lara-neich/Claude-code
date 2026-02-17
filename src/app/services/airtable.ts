import type { Study, Quote, KeyLearning } from "../data/types"
import { mockStudy } from "../data/mockData"

// --- Configuration ---
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || ""
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || ""
const USE_MOCK_DATA = !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

// Keep a mutable copy for mock mode
let studyData: Study = JSON.parse(JSON.stringify(mockStudy))

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(): Promise<void> {
  return delay(200 + Math.random() * 100)
}

// --- Airtable HTTP helpers ---

async function airtableFetch(
  tableName: string,
  options?: { method?: string; body?: Record<string, unknown>; recordId?: string; params?: Record<string, string> }
): Promise<unknown> {
  const { method = "GET", body, recordId, params } = options || {}
  let url = `${BASE_URL}/${encodeURIComponent(tableName)}`
  if (recordId) url += `/${recordId}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Airtable error (${res.status}): ${errText}`)
  }

  return res.json()
}

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

interface AirtableListResponse {
  records: AirtableRecord[]
  offset?: string
}

async function listRecords(tableName: string): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const params: Record<string, string> = {}
    if (offset) params.offset = offset
    const data = (await airtableFetch(tableName, { params })) as AirtableListResponse
    all.push(...data.records)
    offset = data.offset
  } while (offset)

  return all
}

// ---------------------------------------------------------------------------
// Study
// ---------------------------------------------------------------------------

export async function getStudy(): Promise<Study> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    return JSON.parse(JSON.stringify(studyData))
  }

  const [studyRecords, goalRecords, objectiveRecords, nextStepRecords, learningRecords, quoteRecords] =
    await Promise.all([
      listRecords("Studies"),
      listRecords("Goals"),
      listRecords("Learning_Objectives"),
      listRecords("Key_Learnings"),
      listRecords("Quotes"),
      listRecords("Next_Steps"),
    ])

  const studyRec = studyRecords[0]
  const studyFields = studyRec?.fields || {}

  const goals = goalRecords.map((r) => ({
    id: r.id,
    text: String(r.fields["Text"] || ""),
    checked: r.fields["Checked"] === true,
  }))

  const learningObjectives = objectiveRecords.map((r) => ({
    id: r.id,
    text: String(r.fields["Text"] || ""),
    checked: r.fields["Checked"] === true,
  }))

  const nextSteps = nextStepRecords.map((r) => ({
    id: r.id,
    text: String(r.fields["Text"] || ""),
    checked: r.fields["Checked"] === true,
  }))

  const keyLearnings: KeyLearning[] = learningRecords.map((r) => {
    const f = r.fields
    const title = String(f["Title"] || "")

    // Parse confidence over time: stored as "45 → 55 → 68"
    const confidenceStr = String(f["Confidence Over Time"] || "")
    const confidenceOverTime = confidenceStr
      .split("→")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((val, i) => ({
        interview: `Interview ${i + 1}`,
        confidence: parseInt(val, 10) || 0,
      }))

    // Find quotes linked to this key learning
    const linkedQuotes: Quote[] = quoteRecords
      .filter((q) => String(q.fields["Key Learning"] || "") === title)
      .map((q) => ({
        id: q.id,
        text: String(q.fields["Text"] || ""),
        participantName: String(q.fields["Participant Name"] || ""),
        transcriptId: String(q.fields["Transcript ID"] || ""),
        timestamp: String(q.fields["Timestamp"] || ""),
      }))

    // Parse comma-separated tags
    const tagsStr = String(f["Tags"] || "")
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    // Parse why — stored as a single text field
    const whyStr = String(f["Why"] || "")
    const why = whyStr ? [whyStr] : []

    // Parse achieved objectives — comma-separated
    const achievedStr = String(f["Achieved Objectives"] || "")
    const achievedObjectives = achievedStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // Parse follow-up questions — semicolon-separated
    const followUpStr = String(f["Follow Up Questions"] || "")
    const followUpQuestions = followUpStr
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    return {
      id: r.id,
      title,
      confidence: parseInt(String(f["Confidence"] || "0"), 10),
      tags,
      why,
      achievedObjectives,
      followUpQuestions,
      confidenceOverTime,
      quotes: linkedQuotes,
    }
  })

  return {
    name: String(studyFields["Name"] || ""),
    participantFilter: String(studyFields["Participant Filter"] || ""),
    totalParticipants: 0,
    goals,
    learningObjectives,
    nextSteps,
    keyLearnings,
  }
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

  const studyRecords = await listRecords("Studies")
  const studyRec = studyRecords[0]
  if (!studyRec) return

  const airtableFields: Record<string, unknown> = {}
  if (fields.name !== undefined) airtableFields["Name"] = fields.name
  if (fields.participantFilter !== undefined) airtableFields["Participant Filter"] = fields.participantFilter

  await airtableFetch("Studies", {
    method: "PATCH",
    recordId: studyRec.id,
    body: { fields: airtableFields },
  })
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

  await airtableFetch("Goals", {
    method: "PATCH",
    recordId,
    body: { fields: { Checked: checked } },
  })
}

export async function addGoal(text: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `g${Date.now()}`
    studyData.goals.push({ id, text, checked: false })
    return id
  }

  const data = (await airtableFetch("Goals", {
    method: "POST",
    body: { fields: { Text: text, Checked: false } },
  })) as AirtableRecord
  return data.id
}

export async function removeGoal(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.goals = studyData.goals.filter((g) => g.id !== recordId)
    return
  }

  await airtableFetch("Goals", { method: "DELETE", recordId })
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

  await airtableFetch("Learning_Objectives", {
    method: "PATCH",
    recordId,
    body: { fields: { Checked: checked } },
  })
}

export async function addObjective(text: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `lo${Date.now()}`
    studyData.learningObjectives.push({ id, text, checked: false })
    return id
  }

  const data = (await airtableFetch("Learning_Objectives", {
    method: "POST",
    body: { fields: { Text: text, Checked: false } },
  })) as AirtableRecord
  return data.id
}

export async function removeObjective(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.learningObjectives = studyData.learningObjectives.filter((o) => o.id !== recordId)
    return
  }

  await airtableFetch("Learning_Objectives", { method: "DELETE", recordId })
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

  await airtableFetch("Next_Steps", {
    method: "PATCH",
    recordId,
    body: { fields: { Checked: checked } },
  })
}

export async function addNextStep(text: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `ns${Date.now()}`
    studyData.nextSteps.push({ id, text, checked: false })
    return id
  }

  const data = (await airtableFetch("Next_Steps", {
    method: "POST",
    body: { fields: { Text: text, Checked: false } },
  })) as AirtableRecord
  return data.id
}

export async function removeNextStep(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.nextSteps = studyData.nextSteps.filter((s) => s.id !== recordId)
    return
  }

  await airtableFetch("Next_Steps", { method: "DELETE", recordId })
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

  const airtableFields: Record<string, unknown> = {}
  if (fields.title !== undefined) airtableFields["Title"] = fields.title
  if (fields.confidence !== undefined) airtableFields["Confidence"] = String(fields.confidence)
  if (fields.tags !== undefined) airtableFields["Tags"] = fields.tags.join(", ")
  if (fields.why !== undefined) airtableFields["Why"] = fields.why.join("\n")
  if (fields.achievedObjectives !== undefined)
    airtableFields["Achieved Objectives"] = fields.achievedObjectives.join(", ")
  if (fields.followUpQuestions !== undefined)
    airtableFields["Follow Up Questions"] = fields.followUpQuestions.join("; ")

  await airtableFetch("Key_Learnings", {
    method: "PATCH",
    recordId,
    body: { fields: airtableFields },
  })
}

export async function addInsight(insight: Omit<KeyLearning, "id">): Promise<string> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    const id = `kl${Date.now()}`
    studyData.keyLearnings.push({ id, ...insight })
    return id
  }

  const data = (await airtableFetch("Key_Learnings", {
    method: "POST",
    body: {
      fields: {
        Title: insight.title,
        Confidence: String(insight.confidence),
        Tags: insight.tags.join(", "),
        Why: insight.why.join("\n"),
        "Achieved Objectives": insight.achievedObjectives.join(", "),
        "Follow Up Questions": insight.followUpQuestions.join("; "),
        "Confidence Over Time": insight.confidenceOverTime.map((p) => String(p.confidence)).join(" → "),
      },
    },
  })) as AirtableRecord
  return data.id
}

export async function removeInsight(recordId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await randomDelay()
    studyData.keyLearnings = studyData.keyLearnings.filter((k) => k.id !== recordId)
    return
  }

  await airtableFetch("Key_Learnings", { method: "DELETE", recordId })
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

  // Look up the insight title to link the quote
  const learningRecords = await listRecords("Key_Learnings")
  const learning = learningRecords.find((r) => r.id === insightId)
  const insightTitle = learning ? String(learning.fields["Title"] || "") : ""

  const data = (await airtableFetch("Quotes", {
    method: "POST",
    body: {
      fields: {
        Text: quote.text,
        "Participant Name": quote.participantName,
        "Transcript ID": quote.transcriptId,
        Timestamp: quote.timestamp,
        "Key Learning": insightTitle,
      },
    },
  })) as AirtableRecord
  return data.id
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

  await airtableFetch("Quotes", { method: "DELETE", recordId: quoteId })
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

  const airtableFields: Record<string, unknown> = {}
  if (fields.text !== undefined) airtableFields["Text"] = fields.text
  if (fields.participantName !== undefined) airtableFields["Participant Name"] = fields.participantName
  if (fields.transcriptId !== undefined) airtableFields["Transcript ID"] = fields.transcriptId
  if (fields.timestamp !== undefined) airtableFields["Timestamp"] = fields.timestamp

  await airtableFetch("Quotes", {
    method: "PATCH",
    recordId: quoteId,
    body: { fields: airtableFields },
  })
}
