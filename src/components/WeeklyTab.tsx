'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { CheckCircle, XCircle, Download, FileText, Sparkles, X, Plus } from 'lucide-react';

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

type MockCampaignBriefing = {
  id: string;
  name: string;
  summary: string[];
  actions: string[];
  llmText: string;
};

type MockWeeklyBriefing = {
  weekId: string;
  label: string;
  period: string;
  overview: string[];
  campaigns: MockCampaignBriefing[];
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
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [activeBriefingTab, setActiveBriefingTab] = useState<string>('overview');

  const llmBriefingMock = useMemo<MockWeeklyBriefing[]>(
    () => [
      {
        weekId: '2024-W40',
        label: 'KW 40 · 30.09 – 06.10',
        period: '30.09 – 06.10.2024',
        overview: [
          'Executive Summary: Lead-Generierung +15 % gegenüber der Vorwoche bei stabiler CPL.',
          'Top-Performer ist „Lead Gen Herbst“ mit starkem Creative-Neuzugang.',
          'Empfehlung: Awareness-Budget leicht drosseln und in Performance-Kampagnen umschichten.'
        ],
        campaigns: [
          {
            id: 'campaign-1',
            name: 'Lead Gen Herbst',
            summary: [
              'Leads +18 % vs. Vorwoche durch neues Carousel-Asset.',
              'CTR stieg von 2,4 % auf 3,1 % – Zielgruppenerweiterung erfolgreich.'
            ],
            actions: [
              'Budget in KW41 um weitere +10 % erhöhen.',
              'Creative-Variante B testen und nach 3 Tagen evaluieren.'
            ],
            llmText:
              'Headline: Lead Gen Herbst übertrifft Ziele\n\nPerformance Überblick:\n- Spend: €5.420 (+12 % WoW)\n- Leads: 138 (+18 % WoW)\n- CPL: €39,28 (-5,2 % WoW)\n\nWichtige Beobachtungen:\n1. Das neue Carousel-Asset erzeugt 42 % der Leads bei bester CPL.\n2. Lookalike-Targeting 5 % reagiert stärker als 1 %, was auf eine breitere Resonanz hindeutet.\n3. Engagement auf LinkedIn Form Fill bleibt hoch (Abbruchquote < 18 %).\n\nEmpfohlene Aktionen:\n• Budget-Ramp von +10 % bestätigen (nächste Woche beobachten).\n• Creative-B-Variante in Rotation nehmen, Fokus auf Value Proposition (ROI-Bezug).\n• Prüfung: Follow-up Sequenz im CRM nach 24 h verkürzen, um Conversion-Zeit zu optimieren.\n\nRisiken:\n• Frequency steigt auf 3,4 – parallele Awareness-Maßnahmen beobachten, damit keine Übersättigung entsteht.'
          },
          {
            id: 'campaign-2',
            name: 'Brand Awareness Q4',
            summary: [
              'Impressions +9 %, Leads stagnieren.',
              'Frequency klettert auf 3,8 – Ermüdungserscheinungen möglich.'
            ],
            actions: [
              'Neue Visuals vorbereiten, um Ad Fatigue entgegenzuwirken.',
              'Cap bei Frequency 3,5 testen.'
            ],
            llmText:
              'Headline: Brand Awareness Q4 verliert an Dynamik\n\nPerformance Überblick:\n- Impressions: 128.400 (+9 % WoW)\n- Clicks: 1.140 (+2 % WoW)\n- Leads: 24 (±0)\n- CPM: €18,20 (+6 % WoW)\n\nAnalyse:\n1. CTR stagniert bei 0,89 %, obwohl Reach ausgebaut wurde – Creative Fatigue sichtbar.\n2. Frequenz 3,8 über Zielwert (3,0) → stärkere Wiederholungsrate bei denselben Creatives.\n3. Kampagne liefert starke Top-of-Funnel KPIs, aber keine zusätzlichen Leads.\n\nEmpfehlungen:\n• Creative Refresh mit Storytelling-Variante anstoßen.\n• CTA auf “Learn More” testen, um höhere Click-to-Landing-Rate zu forcieren.\n• Nächste Woche Budget um 5 % reduzieren und in Performance-Kampagne verschieben.\n\nRisiken:\n• Sinkendes Engagement könnte trotz Awareness-Ziel zu schwierigerem Retargeting führen.\n• Bei unverändert hoher Frequency droht Relevanzverlust (LinkedIn Quality Score beobachten).'
          }
        ]
      },
      {
        weekId: '2024-W39',
        label: 'KW 39 · 23.09 – 29.09',
        period: '23.09 – 29.09.2024',
        overview: [
          'Leads stabil, CPC leicht gestiegen durch mehr Wettbewerb.',
          'Creative-Refresh für Retargeting angesetzt, um CTR wieder auf 2,5 % zu bringen.'
        ],
        campaigns: [
          {
            id: 'campaign-3',
            name: 'Retargeting Herbst',
            summary: [
              'Lead-Form Abschlüsse -6 % vs. Vorwoche.',
              'Frequency bei 4,1 – Rotation dringend empfohlen.'
            ],
            actions: [
              'Neues Video-Asset vorziehen.',
              'Landing-Page Copy mit Variation B testen.'
            ],
            llmText:
              'Headline: Retargeting Herbst im Rückwärtsgang\n\nPerformance Überblick:\n- Leads: 62 (-6 % WoW)\n- CPL: €42,75 (+4 % WoW)\n- Conversion Rate: 3,4 % (-0,2 PP WoW)\n\nInsights:\n• Die aktuelle Audience wird zu häufig erreicht (Frequency 4,1).\n• Video-View-Rate sinkt von 37 % → 29 %, was auf zu ähnliche Creatives hindeutet.\n• CRM Feedback: Lead-Qualität stabil, aber langsamere Reaktionszeit der SDRs.\n\nEmpfehlungen:\n1. Neues Video-Asset sofort launchen (Fokus auf Product Demo).\n2. Frequency Cap auf 3,2 setzen und Audience Refresh (Exclude 30d und 60d).\n3. Landing-Page Copy Variation B testen, CTA stärker auf „Jetzt Demo sichern“ ausrichten.\n\nFollow-up:\n• SDR-Team informieren, dass Response-Zeit auf < 12h reduziert werden sollte.\n• Nächste Woche Conversion Rate erneut prüfen.'
          }
        ]
      }
    ],
    []
  );
  const [selectedBriefingWeek, setSelectedBriefingWeek] = useState<MockWeeklyBriefing | null>(null);

  const loading = loadingBriefing || loadingMetrics;

  useEffect(() => {
    if (!selectedBriefingWeek && llmBriefingMock.length) {
      setSelectedBriefingWeek(llmBriefingMock[0]);
      setActiveBriefingTab('overview');
    }
  }, [llmBriefingMock, selectedBriefingWeek]);

  const handleOpenBriefingModal = () => {
    if (!selectedBriefingWeek) return;
    setActiveBriefingTab('overview');
    setShowBriefingModal(true);
  };

  const handleSelectBriefingWeek = (week: MockWeeklyBriefing) => {
    setSelectedBriefingWeek(week);
    setActiveBriefingTab('overview');
  };

  const selectedCampaignBriefing =
    selectedBriefingWeek?.campaigns.find((campaign) => campaign.id === activeBriefingTab) ?? null;

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

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">LLM-Briefings pro Woche</h3>
              <p className="text-xs text-blue-100/70">
                Wähle eine Kalenderwoche, um das gespeicherte KI-Briefing einzusehen. Aktuell siehst du Mock-Daten zum Designcheck.
              </p>
            </div>
            <button
              onClick={handleOpenBriefingModal}
              disabled={!selectedBriefingWeek}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-blue-100 hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />
              Briefing öffnen
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {llmBriefingMock.map((week) => {
              const isActive = selectedBriefingWeek?.weekId === week.weekId;
              return (
                <button
                  key={week.weekId}
                  onClick={() => handleSelectBriefingWeek(week)}
                  className={`rounded-full border px-4 py-2 font-semibold transition ${
                    isActive
                      ? 'border-blue-400/60 bg-blue-500/10 text-blue-100'
                      : 'border-white/10 bg-white/5 text-blue-100/70 hover:border-blue-400/40'
                  }`}
                >
                  {week.label}
                </button>
              );
            })}
          </div>
        </div>

        {selectedBriefingWeek ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setActiveBriefingTab('overview');
                handleOpenBriefingModal();
              }}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left transition hover:border-blue-400/40 hover:bg-blue-500/10"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">Überblick (Preview)</p>
              <p className="mt-1 text-xs text-blue-100/60">{selectedBriefingWeek.period}</p>
              <div className="mt-3 space-y-2 text-xs text-blue-100/70">
                {selectedBriefingWeek.overview.slice(0, 2).map((paragraph, index) => (
                  <p key={`overview-${selectedBriefingWeek.weekId}-${index}`}>{paragraph}</p>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] text-blue-200/80">
                <FileText className="h-3 w-3" /> Briefing öffnen
              </span>
            </button>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">Aktive Kampagnen (Mock)</p>
              <ul className="mt-3 space-y-1 text-xs text-blue-100/70">
                {selectedBriefingWeek.campaigns.map((campaign) => (
                  <li key={campaign.id}>• {campaign.name}</li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-blue-100/60">
                Klicke auf „Briefing öffnen“, um Gesamt- und Kampagnenbriefings im Detail zu sehen.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-blue-100/70">
            Noch keine Briefings hinterlegt.
          </div>
        )}
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

      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur" onClick={() => setShowBriefingModal(false)} />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/60">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedBriefingWeek ? `LLM Briefing – ${selectedBriefingWeek.label}` : 'LLM Briefing'}
                </h3>
                <p className="text-xs text-blue-100/70">
                  {selectedBriefingWeek?.period || 'Bitte zuerst eine Woche auswählen.'}
                </p>
              </div>
              <button
                onClick={() => setShowBriefingModal(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-blue-100 hover:border-blue-400/40 hover:bg-blue-500/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedBriefingWeek ? (
              <>
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-6 py-3 text-xs">
                  <button
                    onClick={() => setActiveBriefingTab('overview')}
                    className={`rounded-full border px-4 py-2 font-semibold transition ${
                      activeBriefingTab === 'overview'
                        ? 'border-blue-400/60 bg-blue-500/10 text-blue-100'
                        : 'border-white/10 bg-white/5 text-blue-100/70 hover:border-blue-400/40'
                    }`}
                  >
                    Gesamtbriefing
                  </button>
                  {selectedBriefingWeek.campaigns.map((campaign) => {
                    const isActive = activeBriefingTab === campaign.id;
                    return (
                      <button
                        key={campaign.id}
                        onClick={() => setActiveBriefingTab(campaign.id)}
                        className={`rounded-full border px-4 py-2 font-semibold transition ${
                          isActive
                            ? 'border-blue-400/60 bg-blue-500/10 text-blue-100'
                            : 'border-white/10 bg-white/5 text-blue-100/70 hover:border-blue-400/40'
                        }`}
                      >
                        Kampagne: {campaign.name}
                      </button>
                    );
                  })}
                </div>

                <div className="px-6 py-6">
                  {activeBriefingTab === 'overview' ? (
                <div className="space-y-4 text-sm text-blue-100/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">Gesamtbriefing</p>
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-xs leading-relaxed text-blue-100/80">
                    {selectedBriefingWeek.overview.map((paragraph, index) => (
                      <p key={`overview-${selectedBriefingWeek.weekId}-${index}`} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                    <p className="mt-4 text-[11px] text-blue-100/60">
                      (Mock) Hier könnte das LLM ein umfassendes Executive Summary liefern – mehrere Absätze, Tabellen oder Stichpunkte,
                      alles scrollbar in einem Feld gespeichert.
                    </p>
                  </div>
                </div>
              ) : selectedCampaignBriefing ? (
                <div className="space-y-5 text-sm text-blue-100/80">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                      Highlights – {selectedCampaignBriefing.name}
                    </p>
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-blue-100/70">
                      <ul className="space-y-1">
                        {selectedCampaignBriefing.summary.map((item, index) => (
                          <li key={`summary-${selectedCampaignBriefing.id}-${index}`}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">Empfohlene Aktionen</p>
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-blue-100/70">
                      <ul className="space-y-1">
                        {selectedCampaignBriefing.actions.map((item, index) => (
                          <li key={`action-${selectedCampaignBriefing.id}-${index}`}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">Detailiertes Kampagnenbriefing</p>
                    <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-blue-100/80 whitespace-pre-line">
                      {selectedCampaignBriefing.llmText}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-100/70">Für diese Auswahl liegt noch kein Briefing vor.</p>
              )}
            </div>
              </>
            ) : (
              <div className="px-6 py-6 text-sm text-blue-100/70">
                Noch keine Woche ausgewählt. Bitte zunächst eine Woche im Dashboard anwählen.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
