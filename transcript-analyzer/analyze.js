import Anthropic from "@anthropic-ai/sdk";
import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config();

// --- Validate environment ---
const required = ["CLAUDE_API_KEY", "AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    console.error("Copy .env.example to .env and fill in your keys.");
    process.exit(1);
  }
}

// --- Initialize clients ---
const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

// --- Helper: fetch all records from a table ---
function fetchAll(tableName, opts = {}) {
  return new Promise((resolve, reject) => {
    const records = [];
    base(tableName)
      .select(opts)
      .eachPage(
        (pageRecords, fetchNextPage) => {
          records.push(...pageRecords);
          fetchNextPage();
        },
        (err) => (err ? reject(err) : resolve(records))
      );
  });
}

// --- Helper: update a record ---
function updateRecord(tableName, id, fields) {
  return new Promise((resolve, reject) => {
    base(tableName).update(id, fields, (err, record) => {
      if (err) reject(err);
      else resolve(record);
    });
  });
}

// --- Helper: create a record ---
function createRecord(tableName, fields) {
  return new Promise((resolve, reject) => {
    base(tableName).create(fields, (err, record) => {
      if (err) reject(err);
      else resolve(record);
    });
  });
}

// --- Build the system prompt ---
const SYSTEM_PROMPT = `You are a qualitative UX research analyst. You analyze user interview transcripts and extract structured insights.

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

// --- Main processing function ---
async function processTranscript(record, goals, objectives, existingLearnings) {
  const rawText = record.get("Raw Text") || "";
  const participantName = record.get("Participant Name") || "Unknown";
  const transcriptId = record.get("Transcript ID") || record.id;

  if (!rawText.trim()) {
    console.log(`  ⏭ Skipping ${transcriptId} — no text`);
    await updateRecord("Transcripts", record.id, {
      "Processing Status": "Skipped — No Text",
    });
    return;
  }

  console.log(`  📝 Processing transcript ${transcriptId} (${participantName})...`);
  await updateRecord("Transcripts", record.id, {
    "Processing Status": "Processing",
  });

  // Build user message
  const userMessage = `## Study Goals
${goals.length > 0 ? goals.map((g, i) => `${i + 1}. ${g}`).join("\n") : "No goals defined yet."}

## Learning Objectives
${objectives.length > 0 ? objectives.map((o, i) => `${i + 1}. ${o}`).join("\n") : "No objectives defined yet."}

## Existing Insights (from previous transcripts)
${
  existingLearnings.length > 0
    ? existingLearnings
        .map((l) => `- "${l.title}" (confidence: ${l.confidence})`)
        .join("\n")
    : "None yet — this is the first transcript."
}

## Transcript — Participant: ${participantName}
${rawText}`;

  // Call Claude
  let analysis;
  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawContent = response.content[0].text;
    const jsonStr = rawContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    analysis = JSON.parse(jsonStr);
  } catch (err) {
    console.error(`  ❌ Error analyzing ${transcriptId}:`, err.message);
    await updateRecord("Transcripts", record.id, {
      "Processing Status": "Error — " + err.message.slice(0, 50),
    });
    return;
  }

  console.log(
    `  ✅ Found: ${analysis.key_learnings?.length || 0} insights, ` +
      `${analysis.confidence_updates?.length || 0} updates, ` +
      `${analysis.quotes?.length || 0} quotes, ` +
      `${analysis.next_steps?.length || 0} next steps`
  );

  // Write new Key Learnings
  if (analysis.key_learnings) {
    for (const learning of analysis.key_learnings) {
      if (!learning.is_new) continue;
      await createRecord("Key_Learnings", {
        Title: learning.title || "Untitled Insight",
        Confidence: String(learning.confidence || 50),
        Tags: (learning.tags || []).join(", "),
        Why: learning.why || "",
        "Achieved Objectives": (learning.achieved_objectives || []).join(", "),
        "Follow Up Questions": (learning.follow_up_questions || []).join("; "),
        "Confidence Over Time": String(learning.confidence || 50),
        "Source Transcripts": transcriptId,
      });
      // Add to existing learnings so the next transcript in this batch sees it
      existingLearnings.push({
        id: null,
        title: learning.title,
        confidence: String(learning.confidence),
        confidenceOverTime: String(learning.confidence),
        sourceTranscripts: transcriptId,
      });
      console.log(
        `     + Insight: "${learning.title}" (confidence: ${learning.confidence})`
      );
    }
  }

  // Apply confidence updates
  if (analysis.confidence_updates) {
    for (const update of analysis.confidence_updates) {
      const existing = existingLearnings.find(
        (l) => l.title.toLowerCase() === update.existing_title.toLowerCase()
      );
      if (existing && existing.id) {
        const prevHistory = existing.confidenceOverTime
          ? existing.confidenceOverTime + " → "
          : "";
        const prevSources = existing.sourceTranscripts
          ? existing.sourceTranscripts + ", "
          : "";
        await updateRecord("Key_Learnings", existing.id, {
          Confidence: String(update.new_confidence),
          "Confidence Over Time": prevHistory + String(update.new_confidence),
          "Source Transcripts": prevSources + transcriptId,
        });
        existing.confidence = String(update.new_confidence);
        existing.confidenceOverTime =
          prevHistory + String(update.new_confidence);
        existing.sourceTranscripts = prevSources + transcriptId;
        console.log(
          `     ↑ Updated: "${existing.title}" → confidence ${update.new_confidence}`
        );
      } else {
        console.log(
          `     ⚠ Could not find existing insight: "${update.existing_title}"`
        );
      }
    }
  }

  // Write Quotes
  if (analysis.quotes) {
    for (const quote of analysis.quotes) {
      await createRecord("Quotes", {
        Text: quote.text || "",
        "Participant Name": participantName,
        "Transcript ID": transcriptId,
        Timestamp: quote.timestamp || "",
        "Key Learning": quote.insight_title || "",
      });
    }
  }

  // Write Next Steps
  if (analysis.next_steps) {
    for (const step of analysis.next_steps) {
      await createRecord("Next_Steps", {
        Text: step.text || "",
        Priority: step.priority || "Medium",
        Checked: false,
        "Related Insight": step.related_insight || "",
      });
    }
  }

  // Mark as processed
  await updateRecord("Transcripts", record.id, {
    "Processing Status": "Processed",
  });
  console.log(`  ✓ Done with ${transcriptId}`);
}

// --- Main ---
async function main() {
  console.log("\n🔍 Research Transcript Analyzer\n");
  console.log("Fetching data from Airtable...\n");

  // Fetch context
  const [goalRecords, objectiveRecords, learningRecords, transcriptRecords] =
    await Promise.all([
      fetchAll("Goals"),
      fetchAll("Learning_Objectives"),
      fetchAll("Key_Learnings"),
      fetchAll("Transcripts"),
    ]);

  const goals = goalRecords
    .map((r) => r.get("Text") || "")
    .filter((t) => t.trim());
  const objectives = objectiveRecords
    .map((r) => r.get("Text") || "")
    .filter((t) => t.trim());
  const existingLearnings = learningRecords.map((r) => ({
    id: r.id,
    title: r.get("Title") || "",
    confidence: r.get("Confidence") || "",
    confidenceOverTime: r.get("Confidence Over Time") || "",
    sourceTranscripts: r.get("Source Transcripts") || "",
  }));

  // Find unprocessed transcripts
  const reprocess = process.argv.includes("--reprocess");
  if (reprocess) {
    console.log("⚠ --reprocess flag detected: will re-analyze ALL transcripts\n");
  }
  const unprocessed = transcriptRecords.filter((r) => {
    if (reprocess) return true;
    const status = r.get("Processing Status") || "";
    return status !== "Processed" && status !== "Processing";
  });

  console.log(`Found ${goals.length} goals, ${objectives.length} objectives`);
  console.log(
    `Found ${existingLearnings.length} existing insights from prior runs`
  );
  console.log(
    `Found ${unprocessed.length} unprocessed transcript(s) out of ${transcriptRecords.length} total\n`
  );

  if (unprocessed.length === 0) {
    console.log(
      "Nothing to process. Add new transcripts to Airtable and run again."
    );
    return;
  }

  // Process each transcript sequentially (so later ones see earlier insights)
  for (const record of unprocessed) {
    await processTranscript(record, goals, objectives, existingLearnings);
    console.log("");
  }

  console.log("🎉 All transcripts processed!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
