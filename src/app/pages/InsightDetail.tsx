import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Edit2, Check, X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Study, KeyLearning } from "../data/types"
import * as airtable from "../services/airtable"
import {
  calculateBayesianConfidence,
  getUniqueParticipantCount,
  buildConfidenceOverTime,
} from "@/lib/bayesian"

export default function InsightDetail() {
  const { insightId } = useParams()
  const navigate = useNavigate()
  const [study, setStudy] = useState<Study | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    airtable.getStudy().then((data) => {
      setStudy(data)
      setLoading(false)
    })
  }, [])

  const insight: KeyLearning | undefined = study?.keyLearnings.find(
    (kl) => kl.id === insightId
  )

  function startEditing() {
    if (!insight) return
    setEditTitle(insight.title)
    setEditing(true)
  }

  async function saveTitle() {
    if (!insight || !study) return
    setStudy({
      ...study,
      keyLearnings: study.keyLearnings.map((kl) =>
        kl.id === insight.id ? { ...kl, title: editTitle } : kl
      ),
    })
    setEditing(false)
    await airtable.updateInsight(insight.id, { title: editTitle })
  }

  function cancelEditing() {
    setEditing(false)
  }

  // Get unique transcripts from quotes
  const uniqueTranscripts = insight
    ? Array.from(new Set(insight.quotes.map((q) => q.transcriptId)))
    : []

  const uniqueInterviews = insight
    ? new Set(insight.quotes.map((q) => q.transcriptId)).size
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    )
  }

  if (!insight || !study) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Insight not found.</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to overview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Left Panel - Insight Details */}
        <div className="w-[720px] p-8 border-r space-y-8">
          {/* Confidence — Bayesian posterior mean */}
          {(() => {
            const participantCount = getUniqueParticipantCount(insight)
            const confidence = calculateBayesianConfidence(participantCount, study.totalParticipants)
            return (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Confidence: {confidence}% ({participantCount} of {study.totalParticipants} participants)
                </p>
                <Progress value={confidence} className="h-10" />
              </div>
            )
          })()}

          {/* Title */}
          <div className="group">
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-3xl font-normal leading-tight border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveTitle}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={startEditing}
              >
                <h1 className="text-3xl font-normal leading-tight">
                  {insight.title}
                </h1>
                <Edit2 className="h-4 w-4 mt-2 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {insight.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Why */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Why</h2>
            <ul className="space-y-2">
              {insight.why.map((reason, i) => (
                <li key={i} className="text-base">– {reason}</li>
              ))}
            </ul>
          </div>

          {/* Source Transcripts */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {uniqueTranscripts.map((tid) => (
                  <div
                    key={tid}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm font-medium">
                      Transcript {tid}
                    </span>
                    <Button variant="link" size="sm" className="text-sm">
                      View full transcript →
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 pt-3 border-t">
                Based on {insight.quotes.length} quotes from{" "}
                {uniqueInterviews} interview{uniqueInterviews !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Confidence Over Time — Bayesian update after each interview */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Insight confidence over time
            </h2>
            <div className="space-y-3">
              {buildConfidenceOverTime(insight, study.totalParticipants).map((point) => (
                <div key={point.interview} className="flex items-center gap-3">
                  <span className="w-[120px] text-sm text-muted-foreground">
                    {point.interview}
                  </span>
                  <Progress
                    value={point.confidence}
                    className="flex-1 max-w-[300px]"
                  />
                  <span className="w-[50px] text-sm text-right font-medium">
                    {point.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Objectives Achieved */}
          {insight.achievedObjectives.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Learning objectives achieved
              </h2>
              <div className="space-y-2">
                {insight.achievedObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-700">☑</span>
                    <span className="text-base">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {insight.followUpQuestions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Follow-up questions
              </h2>
              <div className="space-y-2">
                {insight.followUpQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-base">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Quotes */}
        <div className="flex-1 p-8">
          <h2 className="text-lg font-semibold mb-6">Supporting Quotes</h2>
          <div className="space-y-4">
            {insight.quotes.map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-semibold text-sm">
                        {quote.participantName}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {quote.transcriptId} · {quote.timestamp}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-base mb-3">"{quote.text}"</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-sm">
                    Show in transcript →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
