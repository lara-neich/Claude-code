// ============================================================
// Airtable Automation Script — AI Transcript Analysis
// ============================================================
// Trigger: "When a record is created" in the Transcripts table
//
// SETUP INSTRUCTIONS:
// 1. Go to Automations tab in your Airtable base
// 2. Create a new automation
// 3. Trigger: "When a record is created" → select Transcripts table
// 4. Action: "Run a script"
// 5. Configure Input Variables (left panel):
//    - recordId: the Record ID of the triggering record
// 6. Paste this entire script into the code editor
// 7. Replace YOUR_CLAUDE_API_KEY below with your actual key
// 8. Test with a sample transcript, then turn the automation on
// ============================================================

// --- Configuration ---
const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

// --- Get input from automation trigger ---
const inputConfig = input.config();
const transcriptRecordId = inputConfig.recordId;

// --- Load tables ---
const transcriptsTable = base.getTable("Transcripts");
const goalsTable = base.getTable("Goals");
const learningObjectivesTable = base.getTable("Learning_Objectives");
const keyLearningsTable = base.getTable("Key_Learnings");
const quotesTable = base.getTable("Quotes");
const nextStepsTable = base.getTable("Next_Steps");

// --- Fetch the triggering transcript ---
const transcriptRecord = await transcriptsTable.selectRecordAsync(transcriptRecordId);

if (!transcriptRecord) {
    console.error("Could not find transcript record:", transcriptRecordId);
    throw new Error("Transcript record not found");
}

const rawText = transcriptRecord.getCellValueAsString("Raw Text");
const participantName = transcriptRecord.getCellValueAsString("Participant Name");
const transcriptId = transcriptRecord.getCellValueAsString("Transcript ID");

if (!rawText || rawText.trim().length === 0) {
    console.log("No transcript text found — skipping analysis.");
    await transcriptsTable.updateRecordAsync(transcriptRecordId, {
        "Processing Status": "Skipped — No Text"
    });
    throw new Error("Empty transcript");
}

// --- Fetch Goals and Learning Objectives for context ---
const goalsQuery = await goalsTable.selectRecordsAsync({ fields: ["Text"] });
const goals = goalsQuery.records
    .map(r => r.getCellValueAsString("Text"))
    .filter(t => t.trim().length > 0);

const objectivesQuery = await learningObjectivesTable.selectRecordsAsync({ fields: ["Text"] });
const objectives = objectivesQuery.records
    .map(r => r.getCellValueAsString("Text"))
    .filter(t => t.trim().length > 0);

// --- Fetch existing Key Learnings to allow confidence updates ---
const existingLearningsQuery = await keyLearningsTable.selectRecordsAsync({
    fields: ["Title", "Confidence", "Confidence Over Time", "Source Transcripts"]
});
const existingLearnings = existingLearningsQuery.records.map(r => ({
    id: r.id,
    title: r.getCellValueAsString("Title"),
    confidence: r.getCellValueAsString("Confidence"),
    confidenceOverTime: r.getCellValueAsString("Confidence Over Time"),
    sourceTranscripts: r.getCellValueAsString("Source Transcripts")
}));

// --- Mark transcript as processing ---
await transcriptsTable.updateRecordAsync(transcriptRecordId, {
    "Processing Status": "Processing"
});

// --- Build the prompt ---
const systemPrompt = `You are a qualitative UX research analyst. You analyze user interview transcripts and extract structured insights.

You will be given:
- A raw transcript from a usability study interview
- The study's goals
- The study's learning objectives
- Any existing insights from previous transcripts

Your job is to:
1. Extract KEY LEARNINGS (insights) with confidence scores
2. Extract supporting QUOTES from the transcript
3. Generate actionable NEXT STEPS
4. Map insights to which learning objectives they address
5. If an existing insight is reinforced by this transcript, flag it for a confidence UPDATE instead of creating a duplicate

Respond with ONLY valid JSON in this exact format:
{
  "key_learnings": [
    {
      "title": "Short insight title",
      "confidence": 75,
      "tags": ["navigation", "usability"],
      "why": "Explanation of why this matters and evidence supporting it",
      "achieved_objectives": ["Learning objective text that this addresses"],
      "follow_up_questions": ["Question to explore further"],
      "is_new": true
    }
  ],
  "confidence_updates": [
    {
      "existing_title": "Title of existing insight to update",
      "new_confidence": 85,
      "reason": "Why confidence changed based on this transcript"
    }
  ],
  "quotes": [
    {
      "text": "Exact quote from transcript",
      "timestamp": "If available, otherwise empty string",
      "insight_title": "Which key learning this supports"
    }
  ],
  "next_steps": [
    {
      "text": "Actionable recommendation",
      "priority": "High|Medium|Low",
      "related_insight": "Which key learning this relates to"
    }
  ]
}

Rules:
- Confidence scores: 0-100 (low = weak signal from one person, high = strong pattern across multiple)
- For the FIRST transcript analyzed, keep confidence scores modest (30-60 range)
- Only increase confidence above 70 when multiple transcripts reinforce the same finding
- Tags should be lowercase, short category labels
- Quotes must be EXACT text from the transcript — do not paraphrase
- Next steps should be specific and actionable, not generic
- Map insights to learning objectives ONLY when there is a clear connection
- Deduplicate: if an existing insight covers the same theme, use confidence_updates instead of creating a new one`;

const userMessage = `## Study Goals
${goals.length > 0 ? goals.map((g, i) => `${i + 1}. ${g}`).join("\n") : "No goals defined yet."}

## Learning Objectives
${objectives.length > 0 ? objectives.map((o, i) => `${i + 1}. ${o}`).join("\n") : "No objectives defined yet."}

## Existing Insights (from previous transcripts)
${existingLearnings.length > 0
    ? existingLearnings.map(l => `- "${l.title}" (confidence: ${l.confidence})`).join("\n")
    : "None yet — this is the first transcript."}

## Transcript — Participant: ${participantName || "Unknown"}
${rawText}`;

// --- Call Claude API ---
console.log(`Sending transcript "${transcriptId}" to Claude for analysis...`);

let response;
try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 4096,
            messages: [
                { role: "user", content: userMessage }
            ],
            system: systemPrompt
        })
    });
} catch (err) {
    console.error("Network error calling Claude API:", err);
    await transcriptsTable.updateRecordAsync(transcriptRecordId, {
        "Processing Status": "Error — Network Failure"
    });
    throw err;
}

if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Claude API error (${response.status}):`, errorBody);
    await transcriptsTable.updateRecordAsync(transcriptRecordId, {
        "Processing Status": `Error — API ${response.status}`
    });
    throw new Error(`Claude API returned ${response.status}`);
}

const result = await response.json();
const rawContent = result.content[0].text;

// --- Parse Claude's JSON response ---
let analysis;
try {
    // Handle potential markdown code fences around JSON
    const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    analysis = JSON.parse(jsonStr);
} catch (err) {
    console.error("Failed to parse Claude response as JSON:", rawContent);
    await transcriptsTable.updateRecordAsync(transcriptRecordId, {
        "Processing Status": "Error — Parse Failure"
    });
    throw err;
}

console.log(`Analysis complete. Found ${analysis.key_learnings?.length || 0} new insights, ${analysis.confidence_updates?.length || 0} updates, ${analysis.quotes?.length || 0} quotes, ${analysis.next_steps?.length || 0} next steps.`);

// --- Write new Key Learnings ---
const newLearningRecordIds = {};

if (analysis.key_learnings && analysis.key_learnings.length > 0) {
    for (const learning of analysis.key_learnings) {
        if (!learning.is_new) continue;

        const record = await keyLearningsTable.createRecordAsync({
            "Title": learning.title || "Untitled Insight",
            "Confidence": String(learning.confidence || 50),
            "Tags": (learning.tags || []).join(", "),
            "Why": learning.why || "",
            "Achieved Objectives": (learning.achieved_objectives || []).join(", "),
            "Follow Up Questions": (learning.follow_up_questions || []).join("; "),
            "Confidence Over Time": String(learning.confidence || 50),
            "Source Transcripts": transcriptId
        });
        newLearningRecordIds[learning.title] = record;
        console.log(`Created insight: "${learning.title}" (confidence: ${learning.confidence})`);
    }
}

// --- Apply confidence updates to existing insights ---
if (analysis.confidence_updates && analysis.confidence_updates.length > 0) {
    for (const update of analysis.confidence_updates) {
        const existing = existingLearnings.find(
            l => l.title.toLowerCase() === update.existing_title.toLowerCase()
        );
        if (existing) {
            const prevHistory = existing.confidenceOverTime
                ? existing.confidenceOverTime + " → "
                : "";
            const prevSources = existing.sourceTranscripts
                ? existing.sourceTranscripts + ", "
                : "";

            await keyLearningsTable.updateRecordAsync(existing.id, {
                "Confidence": String(update.new_confidence),
                "Confidence Over Time": prevHistory + String(update.new_confidence),
                "Source Transcripts": prevSources + transcriptId
            });
            console.log(`Updated insight: "${existing.title}" confidence → ${update.new_confidence}`);
        } else {
            console.warn(`Could not find existing insight to update: "${update.existing_title}"`);
        }
    }
}

// --- Write Quotes ---
if (analysis.quotes && analysis.quotes.length > 0) {
    for (const quote of analysis.quotes) {
        await quotesTable.createRecordAsync({
            "Text": quote.text || "",
            "Participant Name": participantName || "Unknown",
            "Transcript ID": transcriptId,
            "Timestamp": quote.timestamp || "",
            "Key Learning": quote.insight_title || ""
        });
    }
    console.log(`Created ${analysis.quotes.length} quotes.`);
}

// --- Write Next Steps ---
if (analysis.next_steps && analysis.next_steps.length > 0) {
    for (const step of analysis.next_steps) {
        await nextStepsTable.createRecordAsync({
            "Text": step.text || "",
            "Priority": step.priority || "Medium",
            "Checked": false,
            "Related Insight": step.related_insight || ""
        });
    }
    console.log(`Created ${analysis.next_steps.length} next steps.`);
}

// --- Mark transcript as processed ---
await transcriptsTable.updateRecordAsync(transcriptRecordId, {
    "Processing Status": "Processed"
});

console.log(`Done! Transcript "${transcriptId}" by ${participantName} fully processed.`);
