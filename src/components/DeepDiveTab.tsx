'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyKPI, FilterOptions, CreativePerformanceStats } from '@/types';
import { Award, AlertTriangle, Sparkles } from 'lucide-react';

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    start: toISODate(start),
    end: toISODate(end),
  };
};

type CampaignOption = { id: string; name: string | null };

type CreativeStatRow = CreativePerformanceStats & { key: string };

export default function DeepDiveTab() {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: getDefaultDateRange(),
    campaignIds: [],
  });
  const [dailyMetrics, setDailyMetrics] = useState<DailyKPI[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCampaign = (campaignId: string) => {
    setFilters((prev) => {
      const current = new Set(prev.campaignIds ?? []);
      if (current.has(campaignId)) {
        current.delete(campaignId);
      } else {
        current.add(campaignId);
      }
      return { ...prev, campaignIds: Array.from(current) };
    });
  };

  const clearCampaignFilter = () => {
    setFilters((prev) => ({ ...prev, campaignIds: [] }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const { start, end } = filters.dateRange;
        let query = supabase
          .from('fact_daily')
          .select('*')
          .gte('date', start)
          .lte('date', end);

        if (filters.campaignIds && filters.campaignIds.length > 0) {
          query = query.in('campaign_id', filters.campaignIds);
        }

        const { data, error } = await query;

        if (!isMounted) return;

        if (error) {
          setError(`KPIs konnten nicht geladen werden: ${error.message}`);
          setDailyMetrics([]);
          setCampaignOptions([]);
          return;
        }

        const mapped = (data || []).map((row) => ({
          id: row.id,
          date: row.date,
          campaignId: row.campaign_id,
          campaignName: row.campaign_name,
          creativeId: row.creative_id,
          creativeName: row.creative_name,
          impressions: row.impressions,
          clicks: row.clicks,
          cost: row.cost,
          leads: row.leads,
          ctr: row.ctr,
          cpc: row.cpc,
          cpm: row.cpm,
          cvr: row.cvr,
          cpl: row.cpl,
        } satisfies DailyKPI));

        setDailyMetrics(mapped);

        const campaigns = new Map<string, string | null>();
        mapped.forEach((item) => {
          campaigns.set(item.campaignId, item.campaignName ?? null);
        });
        setCampaignOptions(Array.from(campaigns.entries()).map(([id, name]) => ({ id, name })));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const getCampaignName = (campaignId: string | null | undefined) => {
    if (!campaignId) return 'Alle Kampagnen';
    const campaign = campaignOptions.find((c) => c.id === campaignId);
    return campaign?.name || campaignId;
  };

  const creativePerformance = useMemo(() => {
    const stats = new Map<string, CreativeStatRow>();

    dailyMetrics.forEach((kpi) => {
      const key = `${kpi.campaignId || 'unknown'}::${kpi.creativeId || 'n/a'}`;
      const current = stats.get(key) ?? {
        key,
        creativeId: kpi.creativeId || 'N/A',
        creativeName: kpi.creativeName ?? kpi.creativeId ?? 'Unbekanntes Creative',
        campaignId: kpi.campaignId,
        campaignName: kpi.campaignName ?? kpi.campaignId,
        impressions: 0,
        clicks: 0,
        cost: 0,
        leads: 0,
        ctr: 0,
        cpc: 0,
        cvr: 0,
        cpl: 0,
        count: 0,
      };

      current.impressions += kpi.impressions;
      current.clicks += kpi.clicks;
      current.cost += kpi.cost;
      current.leads += kpi.leads;
      current.count += 1;

      stats.set(key, current);
    });

    const aggregated = Array.from(stats.values()).map((entry) => {
      const impressions = entry.impressions;
      const clicks = entry.clicks;
      const leads = entry.leads;
      const cost = entry.cost;

      return {
        ...entry,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? cost / clicks : 0,
        cvr: clicks > 0 ? (leads / clicks) * 100 : 0,
        cpl: leads > 0 ? cost / leads : 0,
      } satisfies CreativeStatRow;
    });

    return aggregated.sort((a, b) => a.cpl - b.cpl);
  }, [dailyMetrics]);

  const topPerformers = creativePerformance.slice(0, 3);
  const bottomPerformers = creativePerformance.slice(-3).reverse();

  const renderCreativeCard = (
    creative: CreativeStatRow,
    index: number,
    tone: 'positive' | 'negative'
  ) => {
    const gradient =
      tone === 'positive'
        ? 'from-emerald-500/20 via-emerald-500/10 to-slate-900/40'
        : 'from-rose-500/20 via-rose-500/10 to-slate-900/40';

    return (
      <div key={creative.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-inner shadow-slate-900/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-semibold text-white`}
            >
              {index + 1}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-white">{creative.creativeName}</h4>
              <p className="text-xs text-blue-100/70">{getCampaignName(creative.campaignId)}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-blue-100/80">
          <div>
            <span className="block text-[11px] uppercase tracking-wide text-blue-300/70">CPL</span>
            <span className="text-sm font-semibold text-white">€{creative.cpl.toFixed(2)}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wide text-blue-300/70">Leads</span>
            <span className="text-sm font-semibold text-white">{creative.leads}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wide text-blue-300/70">CVR</span>
            <span className="text-sm font-semibold text-white">{creative.cvr.toFixed(2)}%</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wide text-blue-300/70">CTR</span>
            <span className="text-sm font-semibold text-white">{creative.ctr.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5 text-blue-100" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Creative Deep Dive</h2>
              <p className="text-sm text-blue-100/70">Identifiziere Gewinner und Kostentreiber deiner Creatives.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-blue-100/70">
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Zeitraum: {filters.dateRange.start} – {filters.dateRange.end}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              {dailyMetrics.length} KPI Rows
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
              Zeitraum
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
              Kampagne
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearCampaignFilter}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  (filters.campaignIds ?? []).length === 0
                    ? 'border-blue-400/60 bg-blue-500/10 text-blue-100'
                    : 'border-white/10 bg-slate-900/60 text-blue-100/70 hover:border-blue-400/40'
                }`}
              >
                Alle Kampagnen
              </button>
              {campaignOptions.map((campaign) => {
                const isSelected = (filters.campaignIds ?? []).includes(campaign.id);
                return (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => toggleCampaign(campaign.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? 'border-blue-400/60 bg-blue-500/10 text-blue-100 shadow-inner shadow-blue-500/20'
                        : 'border-white/10 bg-slate-900/60 text-blue-100/70 hover:border-blue-400/40'
                    }`}
                  >
                    {campaign.name || campaign.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {loading && <p className="mt-4 text-sm text-blue-200">Lade KPIs…</p>}
        {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3 border-b border-emerald-400/40 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Award className="h-5 w-5 text-white" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Beste CPL Performance</h3>
              <p className="text-sm text-emerald-100/80">Top 3 Creatives mit niedrigstem Cost per Lead</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-emerald-100/80">Keine Creatives im ausgewählten Zeitraum.</p>
            ) : (
              topPerformers.map((creative, index) => renderCreativeCard(creative, index, 'positive'))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-lg shadow-rose-500/20">
          <div className="flex items-center gap-3 border-b border-rose-400/40 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <AlertTriangle className="h-5 w-5 text-white" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Verbesserungspotenzial</h3>
              <p className="text-sm text-rose-100/80">3 Creatives mit dem höchsten CPL</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {bottomPerformers.length === 0 ? (
              <p className="text-sm text-rose-100/80">Keine Creatives im ausgewählten Zeitraum.</p>
            ) : (
              bottomPerformers.map((creative, index) => renderCreativeCard(creative, index, 'negative'))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
