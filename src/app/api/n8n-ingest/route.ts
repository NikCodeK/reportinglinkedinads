import { NextResponse } from 'next/server'
import { WeeklyBriefingRecommendation } from '@/types'
import {
  upsertDailyMetrics,
  saveWeeklyBriefing,
  DailyMetricPayload,
  WeeklyBriefingPayload,
} from '@/lib/server/kpiRepository'

const AUTH_HEADER_PREFIX = 'Bearer '

const parseDailyMetrics = (input: unknown): DailyMetricPayload[] => {
  if (!Array.isArray(input)) {
    return []
  }

  return input.filter((item): item is DailyMetricPayload => {
    if (!item || typeof item !== 'object') {
      return false
    }

    const candidate = item as Record<string, unknown>

    return (
      typeof candidate.date === 'string' &&
      typeof candidate.campaignId === 'string' &&
      typeof candidate.impressions === 'number' &&
      typeof candidate.clicks === 'number' &&
      typeof candidate.cost === 'number' &&
      typeof candidate.leads === 'number' &&
      typeof candidate.ctr === 'number' &&
      typeof candidate.cpc === 'number' &&
      typeof candidate.cpm === 'number' &&
      typeof candidate.cvr === 'number' &&
      typeof candidate.cpl === 'number'
    )
  }).map((item) => ({
    date: item.date,
    campaignId: item.campaignId,
    creativeId: item.creativeId ?? null,
    campaignName: item.campaignName ?? null,
    creativeName: item.creativeName ?? null,
    impressions: item.impressions,
    clicks: item.clicks,
    cost: item.cost,
    leads: item.leads,
    ctr: item.ctr,
    cpc: item.cpc,
    cpm: item.cpm,
    cvr: item.cvr,
    cpl: item.cpl,
  }))
}

const parseWeeklyBriefing = (input: unknown): WeeklyBriefingPayload | null => {
  if (!input || typeof input !== 'object') {
    return null
  }

  const candidate = input as Record<string, unknown>

  if (typeof candidate.weekStart !== 'string' || typeof candidate.weekEnd !== 'string' || typeof candidate.summary !== 'string') {
    return null
  }

  return {
    weekStart: candidate.weekStart,
    weekEnd: candidate.weekEnd,
    summary: candidate.summary,
    highlights: Array.isArray(candidate.highlights) ? candidate.highlights.filter((item): item is string => typeof item === 'string') : undefined,
    insights: Array.isArray(candidate.insights) ? candidate.insights.filter((item): item is string => typeof item === 'string') : undefined,
    kpiComparisons: candidate.kpiComparisons && typeof candidate.kpiComparisons === 'object' ? (candidate.kpiComparisons as Record<string, unknown>) : undefined,
    recommendations: Array.isArray(candidate.recommendations)
      ? candidate.recommendations
          .filter((item): item is WeeklyBriefingRecommendation => {
            if (!item || typeof item !== 'object') {
              return false
            }
            const rec = item as Record<string, unknown>
            return (
              typeof rec.action === 'string' &&
              typeof rec.reasoning === 'string' &&
              (rec.impact === 'low' || rec.impact === 'medium' || rec.impact === 'high')
            )
          })
          .map((item) => ({
            id: typeof item.id === 'string' ? item.id : undefined,
            action: item.action,
            reasoning: item.reasoning,
            impact: item.impact,
            status:
              item.status === 'approved' || item.status === 'rejected' || item.status === 'pending'
                ? item.status
                : undefined,
          }))
      : undefined,
    status: candidate.status === 'published' ? 'published' : 'draft',
    rawPayload: candidate,
  }
}

export const POST = async (request: Request) => {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.N8N_INGEST_TOKEN

  if (expectedToken) {
    if (!authHeader || !authHeader.startsWith(AUTH_HEADER_PREFIX)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace(AUTH_HEADER_PREFIX, '').trim()

    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = await request.json().catch(() => null)

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const data = payload as Record<string, unknown>

  const dailyMetrics = parseDailyMetrics(data.dailyMetrics)
  const weeklyBriefing = parseWeeklyBriefing(data.weeklyBriefing)

  if (!dailyMetrics.length && !weeklyBriefing) {
    return NextResponse.json({ error: 'Nothing to ingest' }, { status: 400 })
  }

  const results: Record<string, unknown> = {}

  if (dailyMetrics.length) {
    const { error } = await upsertDailyMetrics(dailyMetrics)

    if (error) {
      return NextResponse.json({ error: 'Failed to persist daily metrics', details: error.message }, { status: 500 })
    }

    results.dailyMetrics = {
      received: dailyMetrics.length,
    }
  }

  if (weeklyBriefing) {
    const { data: weeklyRecord, error } = await saveWeeklyBriefing(weeklyBriefing)

    if (error) {
      return NextResponse.json({ error: 'Failed to persist weekly briefing', details: error.message }, { status: 500 })
    }

    results.weeklyBriefing = weeklyRecord
  }

  return NextResponse.json({ status: 'ok', ...results })
}
