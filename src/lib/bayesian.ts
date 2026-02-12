import type { KeyLearning } from "@/app/data/types"

/**
 * Calculates Bayesian confidence using a Beta-Binomial model.
 *
 * Prior: Beta(1, 1) — uniform (no prior assumption).
 * After observing k supporters out of n total participants,
 * the posterior is Beta(1 + k, 1 + n - k).
 *
 * Returns the posterior mean as a percentage (0–100), which represents
 * how confident we are that the insight is broadly held, given the evidence.
 */
export function calculateBayesianConfidence(
  supportingParticipants: number,
  totalParticipants: number
): number {
  const alpha = 1 + supportingParticipants
  const beta = 1 + totalParticipants - supportingParticipants
  const posteriorMean = alpha / (alpha + beta)
  return Math.round(posteriorMean * 100)
}

/**
 * Counts unique participants who provided quotes for an insight.
 */
export function getUniqueParticipantCount(insight: KeyLearning): number {
  return new Set(insight.quotes.map((q) => q.participantName)).size
}

/**
 * Builds a confidence-over-time series by replaying quotes in order,
 * recalculating Bayesian confidence after each new unique participant.
 * Each interview (transcript) is treated as one observation.
 */
export function buildConfidenceOverTime(
  insight: KeyLearning,
  totalParticipants: number
): { interview: string; confidence: number }[] {
  const seen = new Set<string>()
  const points: { interview: string; confidence: number }[] = []
  let interviewCount = 0

  for (const quote of insight.quotes) {
    if (seen.has(quote.transcriptId)) continue
    seen.add(quote.transcriptId)
    interviewCount++
    const uniqueParticipants = new Set(
      insight.quotes
        .filter((q) => seen.has(q.transcriptId))
        .map((q) => q.participantName)
    ).size
    points.push({
      interview: `Interview ${interviewCount}`,
      confidence: calculateBayesianConfidence(uniqueParticipants, totalParticipants),
    })
  }

  return points
}
