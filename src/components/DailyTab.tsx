'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyKPI, FilterOptions } from '@/types';

const ITEMS_PER_PAGE = 25;

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

export default function DailyTab() {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: getDefaultDateRange(),
    campaignIds: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [dailyMetrics, setDailyMetrics] = useState<DailyKPI[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<Array<{ id: string; name: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadLatestDateRange = async () => {
      const { data, error } = await supabase
        .from('fact_daily')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (!error && data?.date) {
        const latest = new Date(`${data.date}T00:00:00Z`);
        const start = new Date(latest);
        start.setDate(latest.getDate() - 6);

        setFilters((prev) => ({
          ...prev,
          dateRange: {
            start: toISODate(start),
            end: toISODate(latest),
          },
        }));
      }

      setInitialized(true);
    };

    loadLatestDateRange();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!filters.dateRange.start || !filters.dateRange.end || !initialized) return;

    let isMounted = true;

    const fetchDailyMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const { start, end } = filters.dateRange;
        let query = supabase
          .from('fact_daily')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false })
          .order('campaign_id', { ascending: true });

        if (filters.campaignIds && filters.campaignIds.length > 0) {
          query = query.in('campaign_id', filters.campaignIds);
        }

        const { data, error } = await query;

        if (!isMounted) return;

        if (error) {
          setError(error.message);
          setDailyMetrics([]);
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
          updatedAt: row.updated_at ?? null,
        } satisfies DailyKPI));

        setDailyMetrics(mapped);

        const campaigns = new Map<string, string | null>();
        mapped.forEach((item) => {
          campaigns.set(item.campaignId, item.campaignName ?? null);
        });
        setCampaignOptions(Array.from(campaigns.entries()).map(([id, name]) => ({ id, name })));

        const newestUpdate = mapped.reduce<string | null>((acc, item) => {
          if (!item.updatedAt) return acc;
          if (!acc) return item.updatedAt;
          return item.updatedAt > acc ? item.updatedAt : acc;
        }, null);

        setLastUpdated(newestUpdate);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDailyMetrics();

    return () => {
      isMounted = false;
    };
  }, [filters, initialized]);

  const filteredKPIs = useMemo(() => dailyMetrics, [dailyMetrics]);

  const totalPages = Math.ceil(filteredKPIs.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedKPIs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredKPIs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredKPIs, currentPage]);

  const hasResults = filteredKPIs.length > 0;

  const summaryMetrics = useMemo(() => {
    if (!filteredKPIs.length) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalLeads: 0,
        avgCtr: 0,
        avgCvr: 0,
        avgCpl: 0,
      };
    }

    const totals = filteredKPIs.reduce(
      (acc, item) => {
        acc.totalImpressions += item.impressions;
        acc.totalClicks += item.clicks;
        acc.totalCost += item.cost;
        acc.totalLeads += item.leads;
        return acc;
      },
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalLeads: 0,
      }
    );

    const avgCtr = totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0;
    const avgCvr = totals.totalClicks > 0 ? (totals.totalLeads / totals.totalClicks) * 100 : 0;
    const avgCpl = totals.totalLeads > 0 ? totals.totalCost / totals.totalLeads : 0;

    return {
      ...totals,
      avgCtr,
      avgCvr,
      avgCpl,
    };
  }, [filteredKPIs]);

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  const getCampaignName = (campaignId: string) => {
    const campaign = campaignOptions.find((c) => c.id === campaignId);
    return campaign?.name || campaignId;
  };

  const getCreativeName = (creativeId?: string | null, fallbackName?: string | null) => {
    if (fallbackName) return fallbackName;
    return creativeId || 'N/A';
  };

  const toggleCampaign = (campaignId: string) => {
    setCurrentPage(1);
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
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, campaignIds: [] }));
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Impressions',
            value: summaryMetrics.totalImpressions.toLocaleString('de-DE'),
            hint: 'Summe im Zeitraum',
            tone: 'from-blue-500 via-indigo-500 to-cyan-400',
          },
          {
            title: 'Spend',
            value: formatCurrency(summaryMetrics.totalCost),
            hint: `${summaryMetrics.totalClicks.toLocaleString('de-DE')} Clicks`,
            tone: 'from-purple-500 via-fuchsia-500 to-pink-500',
          },
          {
            title: 'Leads',
            value: summaryMetrics.totalLeads.toLocaleString('de-DE'),
            hint: `CVR ${summaryMetrics.avgCvr.toFixed(1)}%`,
            tone: 'from-emerald-500 via-teal-500 to-cyan-500',
          },
          {
            title: 'CPL',
            value: formatCurrency(summaryMetrics.avgCpl || 0),
            hint: `CTR ${summaryMetrics.avgCtr.toFixed(1)}%`,
            tone: 'from-amber-500 via-orange-500 to-rose-500',
          },
        ].map((metric) => (
          <div
            key={metric.title}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 shadow-lg shadow-slate-900/40"
          >
            <div className={`absolute inset-0 opacity-60 blur-xl bg-gradient-to-br ${metric.tone}`} />
            <div className="relative">
              <p className="text-sm font-medium text-blue-100/80">{metric.title}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-3 text-xs text-blue-100/70">{metric.hint}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/30 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Zeitraum & Kampagnen filtern</h2>
            <p className="text-sm text-blue-100/70">Granulare Analyse per Datum und Kampagne.</p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-2 rounded-full border border-blue-400/50 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Letztes Update {new Date(lastUpdated).toLocaleString('de-DE')}
            </div>
          )}
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
                onChange={(e) => {
                  const value = e.target.value;
                  setCurrentPage(1);
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: value },
                  }));
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => {
                  const value = e.target.value;
                  setCurrentPage(1);
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: value },
                  }));
                }}
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

        <div className="mt-4 flex items-center justify-between text-xs text-blue-100/70">
          {lastUpdated ? (
            <span>Letzte Aktualisierung {new Date(lastUpdated).toLocaleString('de-DE')}</span>
          ) : (
            <span>Keine Daten im gewählten Zeitraum</span>
          )}
          {loading && <span className="text-blue-300">Lade Daten…</span>}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-slate-900/40">
        <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Daily Performance ({filteredKPIs.length})</h2>
            <p className="text-sm text-blue-100/70">Direkt aus Supabase – sortiert nach Datum & Kampagne.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-xs text-blue-100/80">
            {filters.dateRange.start} – {filters.dateRange.end}
          </div>
        </div>
        <div className="overflow-x-auto">
          {error && (
            <div className="px-6 py-4 text-sm text-red-200 bg-red-500/10 border-y border-red-400/40">
              Fehler beim Laden der Daten: {error}
            </div>
          )}
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-widest text-blue-100/70">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Campaign</th>
                <th className="px-6 py-3 text-left">Creative</th>
                <th className="px-6 py-3 text-right">Impr.</th>
                <th className="px-6 py-3 text-right">Clicks</th>
                <th className="px-6 py-3 text-right">Spend</th>
                <th className="px-6 py-3 text-right">Leads</th>
                <th className="px-6 py-3 text-right">CTR</th>
                <th className="px-6 py-3 text-right">CPC</th>
                <th className="px-6 py-3 text-right">CPM</th>
                <th className="px-6 py-3 text-right">CVR</th>
                <th className="px-6 py-3 text-right">CPL</th>
              </tr>
            </thead>
            <tbody className="bg-white/[0.02] divide-y divide-white/5">
              {!loading && paginatedKPIs.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-sm text-blue-100/60">
                    Keine KPI-Daten im ausgewählten Zeitraum gefunden.
                  </td>
                </tr>
              )}
              {paginatedKPIs.map((kpi) => (
                <tr key={kpi.id} className="transition hover:bg-blue-500/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                    {new Date(kpi.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                    {getCampaignName(kpi.campaignId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                    {getCreativeName(kpi.creativeId, kpi.creativeName)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {kpi.impressions.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {kpi.clicks.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {formatCurrency(kpi.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {kpi.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {kpi.ctr.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {formatCurrency(kpi.cpc)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {formatCurrency(kpi.cpm)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {kpi.cvr.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {formatCurrency(kpi.cpl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/60 text-sm text-blue-100/80">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={!hasResults || currentPage === 1}
            className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zurück
          </button>
          <span>
            Seite {hasResults ? currentPage : 0} von {hasResults ? totalPages : 0}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={!hasResults || currentPage >= totalPages}
            className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
}
