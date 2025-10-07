'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { WeeklyBriefing, WeeklyBriefingRecommendation, WeeklyData } from '@/types';
import { CheckCircle, XCircle, Download, FileText, Sparkles } from 'lucide-react';

type CampaignPerformance = {
  campaignId: string;
  name: string;
  impressions: number;
  clicks: number;
  cost: number;
  leads: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cvr: number;
};

const getDefaultWeekRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const toISODate = (date: Date) => date.toISOString().slice(0, 10);

  return {
    start: toISODate(start),
    end: toISODate(end),
  };
};

export default function WeeklyTab() {
  const [briefing, setBriefing] = useState<WeeklyBriefing | null>(null);
  const [recommendations, setRecommendations] = useState<WeeklyBriefingRecommendation[]>([]);
  const [chartData, setChartData] = useState<WeeklyData[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(getDefaultWeekRange());
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loading = loadingBriefing || loadingMetrics;

  useEffect(() => {
    let isMounted = true;

    const fetchBriefing = async () => {
      setLoadingBriefing(true);

      try {
        const { data, error } = await supabase
          .from('weekly_briefings')
          .select('*')
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          setError(`Briefing konnte nicht geladen werden: ${error.message}`);
          setBriefing(null);
          setRecommendations([]);
          return;
        }

        if (data) {
          const mapped: WeeklyBriefing = {
            id: data.id,
            weekStart: data.week_start,
            weekEnd: data.week_end,
            summary: data.summary,
            highlights: Array.isArray(data.highlights) ? data.highlights : [],
            insights: Array.isArray(data.insights) ? data.insights : [],
            kpiComparisons: data.kpi_comparisons ?? {},
            recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
            status: data.status ?? 'draft',
            publishedAt: data.published_at ?? null,
            createdAt: data.created_at ?? null,
            updatedAt: data.updated_at ?? null,
          };

          setBriefing(mapped);
          setRecommendations(mapped.recommendations);
          setDateRange({ start: mapped.weekStart, end: mapped.weekEnd });
        } else {
          setBriefing(null);
          setRecommendations([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBriefing(false);
        }
      }
    };

    fetchBriefing();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      setLoadingMetrics(true);

      try {
        const { data, error } = await supabase
          .from('fact_daily')
          .select('*')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);

        if (!isMounted) return;

        if (error) {
          setError(`KPIs konnten nicht geladen werden: ${error.message}`);
          setChartData([]);
          setCampaignPerformance([]);
          return;
        }

        const rows = data || [];
        const dateTotals = new Map<string, { date: string; impressions: number; clicks: number; cost: number; leads: number }>();
        const campaignTotals = new Map<string, CampaignPerformance>();
        let newestUpdate: string | null = null;

        rows.forEach((row) => {
          const impressions = row.impressions ?? 0;
          const clicks = row.clicks ?? 0;
          const cost = Number(row.cost ?? 0);
          const leads = row.leads ?? 0;
          const dateKey = row.date;

          const byDate = dateTotals.get(dateKey) ?? {
            date: dateKey,
            impressions: 0,
            clicks: 0,
            cost: 0,
            leads: 0,
          };
          byDate.impressions += impressions;
          byDate.clicks += clicks;
          byDate.cost += cost;
          byDate.leads += leads;
          dateTotals.set(dateKey, byDate);

          const campaignKey = row.campaign_id;
          const campaignEntry = campaignTotals.get(campaignKey) ?? {
            campaignId: campaignKey,
            name: row.campaign_name ?? campaignKey,
            impressions: 0,
            clicks: 0,
            cost: 0,
            leads: 0,
            ctr: 0,
            cpc: 0,
            cpl: 0,
            cvr: 0,
          };
          campaignEntry.impressions += impressions;
          campaignEntry.clicks += clicks;
          campaignEntry.cost += cost;
          campaignEntry.leads += leads;
          campaignTotals.set(campaignKey, campaignEntry);

          if (row.updated_at && (!newestUpdate || row.updated_at > newestUpdate)) {
            newestUpdate = row.updated_at;
          }
        });

        const nextChartData = Array.from(dateTotals.values())
          .sort((a, b) => a.date.localeCompare(b.date))
          .map<WeeklyData>((entry) => {
            const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
            const cpc = entry.clicks > 0 ? entry.cost / entry.clicks : 0;
            const cpm = entry.impressions > 0 ? (entry.cost / entry.impressions) * 1000 : 0;
            const cvr = entry.clicks > 0 ? (entry.leads / entry.clicks) * 100 : 0;
            const cpl = entry.leads > 0 ? entry.cost / entry.leads : 0;

            return {
              date: new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short' }),
              impressions: entry.impressions,
              clicks: entry.clicks,
              cost: entry.cost,
              leads: entry.leads,
              ctr,
              cpc,
              cpm,
              cvr,
              cpl,
            };
          });

        const nextCampaignPerformance = Array.from(campaignTotals.values()).map((campaign) => {
          const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
          const cpc = campaign.clicks > 0 ? campaign.cost / campaign.clicks : 0;
          const cpl = campaign.leads > 0 ? campaign.cost / campaign.leads : 0;
          const cvr = campaign.clicks > 0 ? (campaign.leads / campaign.clicks) * 100 : 0;

          return {
            ...campaign,
            ctr,
            cpc,
            cpl,
            cvr,
          };
        });

        setChartData(nextChartData);
        setCampaignPerformance(nextCampaignPerformance);
        setLastUpdated(newestUpdate);
      } finally {
        if (isMounted) {
          setLoadingMetrics(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [dateRange]);

  useEffect(() => {
    setRecommendations(briefing?.recommendations ?? []);
  }, [briefing]);

  const handleRecommendationAction = (index: number, action: 'approved' | 'rejected') => {
    setRecommendations((prev) =>
      prev.map((rec, idx) =>
        idx === index
          ? {
              ...rec,
              status: action,
            }
          : rec
      )
    );
  };

  const handlePublish = async () => {
    if (!briefing) return;

    const timestamp = new Date().toISOString();
    const { error: publishError } = await supabase
      .from('weekly_briefings')
      .update({
        status: 'published',
        published_at: timestamp,
        recommendations,
      })
      .eq('id', briefing.id);

    if (publishError) {
      setError(`Veröffentlichung fehlgeschlagen: ${publishError.message}`);
      return;
    }

    setBriefing((prev) =>
      prev
        ? {
            ...prev,
            status: 'published',
            publishedAt: timestamp,
            recommendations,
          }
        : prev
    );
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    alert(`${format.toUpperCase()} Export wird vorbereitet...`);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-rose-500/20 text-rose-200 border border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-200 border border-amber-500/40';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40';
      default:
        return 'bg-slate-600/20 text-slate-200 border border-slate-500/30';
    }
  };

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-slate-900/60 to-slate-900/80 p-6 shadow-xl shadow-blue-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35)_0%,_transparent_55%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5 text-blue-100" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Weekly Briefing</h2>
              <p className="text-sm text-blue-100/80">
                {dateRange.start} – {dateRange.end}
              </p>
            </div>
          </div>
          {lastUpdated && (
            <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs text-blue-100">
              Letztes Update {new Date(lastUpdated).toLocaleString('de-DE')}
            </span>
          )}
        </div>
        <div className="relative mt-5 space-y-4 text-blue-100/90">
          {briefing ? (
            <>
              <p className="text-sm leading-relaxed text-blue-50/90">{briefing.summary}</p>
              {briefing.insights.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {briefing.insights.map((insight, index) => (
                    <li
                      key={`insight-${index}-${insight.slice(0, 12)}`}
                      className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-blue-100/80"
                    >
                      <span className="mt-0.5 flex h-2.5 w-2.5 rounded-full bg-blue-400" />
                      {insight}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-blue-100/80">Keine Insights vorhanden.</p>
              )}
              <div className="text-xs text-blue-100/70">
                Status: {briefing.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                {briefing.publishedAt && (
                  <span className="ml-2">
                    (seit {new Date(briefing.publishedAt).toLocaleDateString('de-DE')})
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-blue-100/80">
              Noch kein Weekly Briefing vorhanden. Sobald n8n Daten liefert, erscheint der Überblick hier.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          {
            title: 'Impressions · Clicks · Spend',
            content: (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#cbd5f5" tick={{ fill: '#cbd5f5' }} />
                  <YAxis stroke="#cbd5f5" tick={{ fill: '#cbd5f5' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.3)', color: '#e2e8f0' }} />
                  <Bar dataKey="impressions" fill="#38bdf8" name="Impressions" />
                  <Bar dataKey="clicks" fill="#22c55e" name="Clicks" />
                  <Bar dataKey="cost" fill="#f97316" name="Cost (€)" />
                </BarChart>
              </ResponsiveContainer>
            ),
          },
          {
            title: 'CPL & CVR Entwicklung',
            content: (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#cbd5f5" tick={{ fill: '#cbd5f5' }} />
                  <YAxis stroke="#cbd5f5" tick={{ fill: '#cbd5f5' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.3)', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="cpl" stroke="#f87171" strokeWidth={2} name="CPL (€)" />
                  <Line type="monotone" dataKey="cvr" stroke="#a855f7" strokeWidth={2} name="CVR (%)" />
                </LineChart>
              </ResponsiveContainer>
            ),
          },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40">
            <h3 className="text-lg font-semibold text-white mb-4">{card.title}</h3>
            {chartData.length > 0 ? (
              card.content
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-blue-100/70">
                {loading ? 'Lade KPIs…' : 'Keine Daten im aktuellen Zeitraum'}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40">
        <h3 className="text-lg font-semibold text-white mb-4">CTR & CPM Entwicklung</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#cbd5f5" tick={{ fill: '#cbd5f5' }} />
              <YAxis stroke="#cbd5f5" tick={{ fill: '#cbd5f5' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.3)', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="ctr" stroke="#06b6d4" strokeWidth={2} name="CTR (%)" />
              <Line type="monotone" dataKey="cpm" stroke="#84cc16" strokeWidth={2} name="CPM (€)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-blue-100/70">
            {loading ? 'Lade KPIs…' : 'Keine Daten im aktuellen Zeitraum'}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-lg shadow-slate-900/40">
        <div className="px-6 py-5 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Kampagnen Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-widest text-blue-100/70">
              <tr>
                <th className="px-6 py-3 text-left">Campaign</th>
                <th className="px-6 py-3 text-right">Impressions</th>
                <th className="px-6 py-3 text-right">Clicks</th>
                <th className="px-6 py-3 text-right">Cost</th>
                <th className="px-6 py-3 text-right">Leads</th>
                <th className="px-6 py-3 text-right">CTR</th>
                <th className="px-6 py-3 text-right">CPL</th>
              </tr>
            </thead>
            <tbody className="bg-white/[0.02] divide-y divide-white/5">
              {campaignPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-sm text-blue-100/70">
                    {loading ? 'Lade KPIs…' : 'Keine Kampagnendaten verfügbar'}
                  </td>
                </tr>
              )}
              {campaignPerformance.map((campaign) => (
                <tr key={campaign.campaignId} className="transition hover:bg-blue-500/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {campaign.impressions.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {campaign.clicks.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {formatCurrency(campaign.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {campaign.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {campaign.ctr.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-right">
                    {formatCurrency(campaign.cpl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="text-lg font-semibold text-white">Empfehlungen</h3>
          <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-blue-100/70">
            {recommendations.length} Vorschläge
          </span>
        </div>
        <div className="pt-4">
          {recommendations.length === 0 ? (
            <p className="text-sm text-blue-100/70">Keine Empfehlungen vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const status = rec.status ?? 'pending';
                const key = rec.id ?? `${index}-${rec.action}`;
                return (
                  <div key={key} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-inner shadow-slate-900/40">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-sm font-semibold text-white">{rec.action}</h4>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getImpactColor(rec.impact)}`}>
                            {rec.impact.toUpperCase()} IMPACT
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-blue-100/80">{rec.reasoning}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRecommendationAction(index, 'approved')}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
                            >
                              <CheckCircle className="h-4 w-4" /> Akzeptieren
                            </button>
                            <button
                              onClick={() => handleRecommendationAction(index, 'rejected')}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-400/50 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-100 hover:bg-rose-500/20"
                            >
                              <XCircle className="h-4 w-4" /> Ablehnen
                            </button>
                          </>
                        )}
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200">
                            <CheckCircle className="h-4 w-4" /> Akzeptiert
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/50 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200">
                            <XCircle className="h-4 w-4" /> Abgelehnt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">Weekly Snapshot publizieren</h4>
          <p className="text-xs text-blue-100/70">Release löst deine n8n Distribution aus (Slack, E-Mail, Docs).</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePublish}
            disabled={!briefing || briefing.status === 'published'}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="h-4 w-4" /> Publish Weekly Snapshot
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-blue-100 hover:border-blue-400/40"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-blue-100 hover:border-blue-400/40"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </section>
    </div>
  );
}
