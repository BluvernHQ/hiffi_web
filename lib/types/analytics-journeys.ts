export interface JourneyChain {
  name: string
  display_name: string
  tags: string[]
  updated_at?: string
  created_at?: string
}

export interface JourneyStep {
  tag: string
  timestamp: string
}

export interface JourneyGroup {
  journey_name: string
  session_id: string
  started_at: string
  completed_at?: string | null
  steps: JourneyStep[]
}

export interface JourneyChainsListResponse {
  chains: JourneyChain[]
  count: number
}

export interface JourneyGroupsListResponse {
  journeys: JourneyGroup[]
  count: number
}

export interface JourneyDetectResponse {
  sessions_scanned: number
  chains: number
  matches_upserted: number
}

export interface EventTagsResponse {
  tags: string[]
  count: number
}

export interface FunnelStageStat {
  index: number
  tag: string
  reached: number
  /** Count dropped between previous stage and this one; null for first stage. */
  dropped_from_previous: number | null
  /** Percent who reached previous stage but not this one. */
  dropoff_rate: number | null
  /** Percent of entrants who reached this stage. */
  conversion_from_start: number
}

export interface FunnelExitStat {
  /** 0-based last step index reached; -1 means no steps. */
  last_step_index: number
  tag: string | null
  count: number
  /** Share of matched journeys that exited here (did not finish full chain). */
  share: number
}

export interface FunnelSummary {
  entrants: number
  completed: number
  completion_rate: number
  stages: FunnelStageStat[]
  exits: FunnelExitStat[]
}

export function normalizeJourneySteps(raw: unknown): JourneyStep[] {
  let steps = raw
  if (typeof steps === "string") {
    try {
      steps = JSON.parse(steps)
    } catch {
      return []
    }
  }
  if (!Array.isArray(steps)) return []
  return steps.map((s) => {
    const row = (s && typeof s === "object" ? s : {}) as Record<string, unknown>
    return {
      tag: String(row.tag ?? ""),
      timestamp: String(row.timestamp ?? ""),
    }
  })
}

/**
 * Build enter → exit drop-off stats for one chain from detected journey groups.
 * A match "reaches" stage i when it has at least i+1 ordered steps.
 * Exit = last matched step when the full chain was not completed.
 */
export function computeFunnelSummary(
  chainTags: string[],
  journeys: JourneyGroup[],
): FunnelSummary {
  const tagged = chainTags.filter(Boolean)
  const entrants = journeys.length
  const completed = journeys.filter((j) => {
    if (j.completed_at) return true
    return normalizeJourneySteps(j.steps).length >= tagged.length && tagged.length > 0
  }).length

  const stages: FunnelStageStat[] = tagged.map((tag, index) => {
    const reached = journeys.filter((j) => normalizeJourneySteps(j.steps).length > index).length
    const prevReached =
      index === 0 ? entrants : journeys.filter((j) => normalizeJourneySteps(j.steps).length > index - 1).length
    const dropped = Math.max(0, prevReached - reached)
    return {
      index,
      tag,
      reached,
      dropped_from_previous: index === 0 ? null : dropped,
      dropoff_rate: index === 0 || prevReached === 0 ? null : dropped / prevReached,
      conversion_from_start: entrants === 0 ? 0 : reached / entrants,
    }
  })

  const exitCounts = new Map<number, number>()
  for (const journey of journeys) {
    const steps = normalizeJourneySteps(journey.steps)
    const isComplete =
      Boolean(journey.completed_at) || (tagged.length > 0 && steps.length >= tagged.length)
    if (isComplete) continue
    const last = steps.length - 1
    exitCounts.set(last, (exitCounts.get(last) ?? 0) + 1)
  }

  const incomplete = Math.max(0, entrants - completed)
  const exits: FunnelExitStat[] = [...exitCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([last_step_index, count]) => ({
      last_step_index,
      tag: last_step_index >= 0 ? tagged[last_step_index] ?? null : null,
      count,
      share: incomplete === 0 ? 0 : count / incomplete,
    }))

  return {
    entrants,
    completed,
    completion_rate: entrants === 0 ? 0 : completed / entrants,
    stages,
    exits,
  }
}
