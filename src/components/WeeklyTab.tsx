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
import { CheckCircle, XCircle, Download, FileText } from 'lucide-react';

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

        if (!isMounted) {
          return;
        }

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

        if (!isMounted) {
          return;
        }

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
    if (!briefing) {
      return;
    }

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
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-blue-900">📊 TL;DR - Diese Woche</h2>
          <div className="text-sm text-blue-800">
            {dateRange.start} – {dateRange.end}
            {lastUpdated && (
              <span className="ml-2 text-blue-600">
                (Letztes Update: {new Date(lastUpdated).toLocaleString('de-DE')})
              </span>
            )}
          </div>
        </div>
        {briefing ? (
          <div className="space-y-4">
            <p className="text-blue-900 text-sm">{briefing.summary}</p>
            {briefing.insights.length > 0 ? (
              <ul className="space-y-2">
                {briefing.insights.map((insight, index) => (
                  <li key={`insight-${index}-${insight.slice(0, 12)}`} className="text-blue-800 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-blue-700 text-sm">Keine Insights vorhanden.</p>
            )}
            <div className="text-xs text-blue-700">
              Status: {briefing.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
              {briefing.publishedAt && (
                <span className="ml-2">
                  (seit {new Date(briefing.publishedAt).toLocaleDateString('de-DE')})
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-blue-800 text-sm">
            Noch kein Weekly Briefing vorhanden. Sobald n8n Daten liefert, erscheint der Überblick hier.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impressions, Clicks &amp; Spend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="impressions" fill="#3B82F6" name="Impressions" />
                <Bar dataKey="clicks" fill="#10B981" name="Clicks" />
                <Bar dataKey="cost" fill="#F59E0B" name="Cost (€)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
              {loading ? 'Lade KPIs…' : 'Keine Daten im aktuellen Zeitraum'}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CPL &amp; CVR Entwicklung</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpl" stroke="#EF4444" strokeWidth={2} name="CPL (€)" />
                <Line type="monotone" dataKey="cvr" stroke="#8B5CF6" strokeWidth={2} name="CVR (%)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
              {loading ? 'Lade KPIs…' : 'Keine Daten im aktuellen Zeitraum'}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CTR &amp; CPM Entwicklung</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ctr" stroke="#06B6D4" strokeWidth={2} name="CTR (%)" />
              <Line type="monotone" dataKey="cpm" stroke="#84CC16" strokeWidth={2} name="CPM (€)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
            {loading ? 'Lade KPIs…' : 'Keine Daten im aktuellen Zeitraum'}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Kampagnen Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost (€)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR (%)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPL (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? 'Lade KPIs…' : 'Keine Kampagnendaten verfügbar'}
                  </td>
                </tr>
              )}
              {campaignPerformance.map((campaign) => (
                <tr key={campaign.campaignId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {campaign.impressions.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {campaign.clicks.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(campaign.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {campaign.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {campaign.ctr.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(campaign.cpl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Empfehlungen</h3>
        </div>
        <div className="p-6">
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">Keine Empfehlungen vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const status = rec.status ?? 'pending';
                const key = rec.id ?? `${index}-${rec.action}`;
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{rec.action}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(rec.impact)}`}>
                            {rec.impact.toUpperCase()} IMPACT
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{rec.reasoning}</p>
                        <div className="flex flex-wrap gap-2">
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRecommendationAction(index, 'approved')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Akzeptieren
                              </button>
                              <button
                                onClick={() => handleRecommendationAction(index, 'rejected')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Ablehnen
                              </button>
                            </>
                          )}
                          {status === 'approved' && (
                            <span className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-800 bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Akzeptiert
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-800 bg-red-100">
                              <XCircle className="w-3 h-3 mr-1" />
                              Abgelehnt
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow">
        <div className="flex space-x-3">
          <button
            onClick={handlePublish}
            disabled={!briefing || briefing.status === 'published'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 mr-2" />
            Publish Weekly Snapshot
          </button>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
