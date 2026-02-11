import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { Maximize2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Study } from "../data/types"
import * as airtable from "../services/airtable"

export default function Overview() {
  const navigate = useNavigate()
  const [study, setStudy] = useState<Study | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    airtable.getStudy().then((data) => {
      setStudy(data)
      setLoading(false)
    })
  }, [])

  const allParticipants = useMemo(() => {
    if (!study) return []
    const names = new Set<string>()
    study.keyLearnings.forEach((kl) =>
      kl.quotes.forEach((q) => names.add(q.participantName))
    )
    return Array.from(names).sort()
  }, [study])

  const allTags = useMemo(() => {
    if (!study) return []
    const tags = new Set<string>()
    study.keyLearnings.forEach((kl) => kl.tags.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [study])

  const filteredInsights = useMemo(() => {
    if (!study) return []
    return study.keyLearnings.filter((kl) => {
      if (selectedTags.length > 0 && !kl.tags.some((t) => selectedTags.includes(t))) return false
      if (selectedObjectives.length > 0 && !kl.achievedObjectives.some((ao) => selectedObjectives.includes(ao))) return false
      if (selectedParticipants.length > 0 && !kl.quotes.some((q) => selectedParticipants.includes(q.participantName))) return false
      return true
    })
  }, [study, selectedTags, selectedObjectives, selectedParticipants])

  function toggleParticipant(name: string) {
    setSelectedParticipants((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    )
  }

  function toggleObjective(obj: string) {
    setSelectedObjectives((prev) =>
      prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]
    )
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleToggleGoal(id: string) {
    if (!study) return
    const goal = study.goals.find((g) => g.id === id)
    if (!goal) return
    const newChecked = !goal.checked
    setStudy({
      ...study,
      goals: study.goals.map((g) => (g.id === id ? { ...g, checked: newChecked } : g)),
    })
    await airtable.updateGoal(id, newChecked)
  }

  async function handleToggleObjective(id: string) {
    if (!study) return
    const obj = study.learningObjectives.find((o) => o.id === id)
    if (!obj) return
    const newChecked = !obj.checked
    setStudy({
      ...study,
      learningObjectives: study.learningObjectives.map((o) =>
        o.id === id ? { ...o, checked: newChecked } : o
      ),
    })
    await airtable.updateObjective(id, newChecked)
  }

  async function handleToggleNextStep(id: string) {
    if (!study) return
    const step = study.nextSteps.find((s) => s.id === id)
    if (!step) return
    const newChecked = !step.checked
    setStudy({
      ...study,
      nextSteps: study.nextSteps.map((s) =>
        s.id === id ? { ...s, checked: newChecked } : s
      ),
    })
    await airtable.updateNextStep(id, newChecked)
  }

  if (loading || !study) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    )
  }

  const participantLabel =
    selectedParticipants.length === 0
      ? "All participants"
      : `${selectedParticipants.length} participant${selectedParticipants.length > 1 ? "s" : ""}`

  const objectiveLabel =
    selectedObjectives.length === 0
      ? "All objectives"
      : `${selectedObjectives.length} objective${selectedObjectives.length > 1 ? "s" : ""}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">[{study.name}]</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">Add insight</Button>
            <Button variant="outline" size="sm">Add transcript</Button>
            <Button variant="outline" size="sm">Share to Github</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Left Panel - Insights */}
        <div className="flex-1 p-8 border-r">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {participantLabel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {allParticipants.map((name) => (
                  <DropdownMenuCheckboxItem
                    key={name}
                    checked={selectedParticipants.includes(name)}
                    onCheckedChange={() => toggleParticipant(name)}
                  >
                    {name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {objectiveLabel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {study.learningObjectives.map((obj) => (
                  <DropdownMenuCheckboxItem
                    key={obj.id}
                    checked={selectedObjectives.includes(obj.text)}
                    onCheckedChange={() => toggleObjective(obj.text)}
                  >
                    {obj.text}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Insight Cards */}
          <div className="space-y-6">
            {filteredInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  {/* Tags + Expand */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap gap-2">
                      {insight.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => navigate(`/insight/${insight.id}`)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Title */}
                  <h2
                    className="text-3xl font-normal leading-tight mb-4 cursor-pointer hover:text-muted-foreground transition-colors"
                    onClick={() => navigate(`/insight/${insight.id}`)}
                  >
                    {insight.title}
                  </h2>

                  {/* Confidence */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-muted-foreground">
                      {insight.confidence >= 70 ? "High" : insight.confidence >= 40 ? "Medium" : "Low"} confidence
                    </span>
                    <Progress value={insight.confidence} className="flex-1 max-w-[300px]" />
                    <span className="text-sm font-medium">{insight.confidence}%</span>
                  </div>

                  {/* Why */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Why</h3>
                    <ul className="space-y-1">
                      {insight.why.map((reason, i) => (
                        <li key={i} className="text-sm">– {reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Achieved Objectives */}
                  {insight.achievedObjectives.length > 0 && (
                    <div>
                      {insight.achievedObjectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm mb-1">
                          <span className="text-green-700">☑</span>
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredInsights.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No insights match the selected filters.
              </p>
            )}
          </div>
        </div>

        {/* Right Panel - Status */}
        <div className="w-[608px] p-8 space-y-6">
          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {study.nextSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={step.checked}
                      onCheckedChange={() => handleToggleNextStep(step.id)}
                    />
                    <label
                      className={cn(
                        "text-sm cursor-pointer leading-relaxed",
                        step.checked && "line-through opacity-50"
                      )}
                      onClick={() => handleToggleNextStep(step.id)}
                    >
                      {index + 1}. {step.text}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {study.goals.map((goal, index) => (
                  <div key={goal.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={goal.checked}
                      onCheckedChange={() => handleToggleGoal(goal.id)}
                    />
                    <label
                      className={cn(
                        "text-sm cursor-pointer leading-relaxed",
                        goal.checked && "line-through opacity-50"
                      )}
                      onClick={() => handleToggleGoal(goal.id)}
                    >
                      {index + 1}. {goal.text}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {study.learningObjectives.map((obj, index) => (
                  <div key={obj.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={obj.checked}
                      onCheckedChange={() => handleToggleObjective(obj.id)}
                    />
                    <label
                      className={cn(
                        "text-sm cursor-pointer leading-relaxed",
                        obj.checked && "line-through opacity-50"
                      )}
                      onClick={() => handleToggleObjective(obj.id)}
                    >
                      {index + 1}. {obj.text}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
