import { WeeklyBriefingRecommendation } from '@/types'
import { getSupabaseAdminClient } from './supabaseAdmin'

export interface DailyMetricPayload {
  date: string
  campaignId: string
  creativeId?: string | null
  campaignName?: string | null
  creativeName?: string | null
  impressions: number
  clicks: number
  cost: number
  leads: number
  ctr: number
  cpc: number
  cpm: number
  cvr: number
  cpl: number
}

export interface WeeklyBriefingPayload {
  weekStart: string
  weekEnd: string
  summary: string
  highlights?: string[]
  insights?: string[]
  kpiComparisons?: Record<string, unknown>
  recommendations?: WeeklyBriefingRecommendation[]
  status?: 'draft' | 'published'
  rawPayload?: Record<string, unknown>
}

export const upsertDailyMetrics = async (items: DailyMetricPayload[]) => {
  if (!items.length) {
    return { data: [], error: null }
  }

  const client = getSupabaseAdminClient()

  const normalized = items.map((item) => ({
    date: item.date,
    campaign_id: item.campaignId,
    creative_id: item.creativeId ?? null,
    campaign_name: item.campaignName ?? null,
    creative_name: item.creativeName ?? null,
    impressions: item.impressions,
    clicks: item.clicks,
    cost: item.cost,
    leads: item.leads,
    ctr: item.ctr,
    cpc: item.cpc,
    cpm: item.cpm,
    cvr: item.cvr,
    cpl: item.cpl,
    updated_at: new Date().toISOString(),
  }))

  return client
    .from('fact_daily')
    .upsert(normalized, { onConflict: 'date,campaign_id,creative_key' })
}

export const saveWeeklyBriefing = async (payload: WeeklyBriefingPayload) => {
  const client = getSupabaseAdminClient()

  const record = {
    week_start: payload.weekStart,
    week_end: payload.weekEnd,
    summary: payload.summary,
    highlights: payload.highlights ?? [],
    insights: payload.insights ?? [],
    kpi_comparisons: payload.kpiComparisons ?? {},
    recommendations: payload.recommendations ?? [],
    status: payload.status ?? 'draft',
    raw_payload: payload.rawPayload ?? {},
    updated_at: new Date().toISOString(),
  }

  return client
    .from('weekly_briefings')
    .upsert(record, { onConflict: 'week_start' })
    .select()
    .single()
}
