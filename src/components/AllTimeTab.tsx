'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AllTimeTotals {
  impressions: number;
  clicks: number;
  cost: number;
  leads: number;
  ctr: number;
  cvr: number;
  cpl: number;
}

interface AggregatedRow {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  cost: number;
  leads: number;
  ctr: number;
  cvr: number;
  cpl: number;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AllTimeTab() {
  const [totals, setTotals] = useState<AllTimeTotals | null>(null);
  const [topCampaigns, setTopCampaigns] = useState<AggregatedRow[]>([]);
  const [topCreatives, setTopCreatives] = useState<AggregatedRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('fact_daily')
        .select('campaign_id,campaign_name,creative_id,creative_name,impressions,clicks,cost,leads,updated_at');

      if (!isMounted) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows = data ?? [];

      const totalsAccumulator = rows.reduce(
        (acc, row) => {
          const impressions = toNumber(row.impressions);
          const clicks = toNumber(row.clicks);
          const cost = toNumber(row.cost);
          const leads = toNumber(row.leads);

          acc.impressions += impressions;
          acc.clicks += clicks;
          acc.cost += cost;
          acc.leads += leads;
          return acc;
        },
        { impressions: 0, clicks: 0, cost: 0, leads: 0 }
      );

      const totalsObj: AllTimeTotals = {
        impressions: totalsAccumulator.impressions,
        clicks: totalsAccumulator.clicks,
        cost: totalsAccumulator.cost,
        leads: totalsAccumulator.leads,
        ctr:
          totalsAccumulator.impressions > 0
            ? (totalsAccumulator.clicks / totalsAccumulator.impressions) * 100
            : 0,
        cvr:
          totalsAccumulator.clicks > 0
            ? (totalsAccumulator.leads / totalsAccumulator.clicks) * 100
            : 0,
        cpl:
          totalsAccumulator.leads > 0
            ? totalsAccumulator.cost / totalsAccumulator.leads
            : 0,
      };

      const aggregateByKey = (key: 'campaign' | 'creative') => {
        const map = new Map<string, AggregatedRow>();

        rows.forEach((row) => {
          const id = key === 'campaign' ? (row.campaign_id as string | null) : (row.creative_id as string | null);
          const nameKey = key === 'campaign' ? row.campaign_name : row.creative_name;
          if (!id) return;

          const existing = map.get(id) ?? {
            id,
            name: (nameKey as string) || 'Unbenannt',
            impressions: 0,
            clicks: 0,
            cost: 0,
            leads: 0,
            ctr: 0,
            cvr: 0,
            cpl: 0,
          };

          const impressions = toNumber(row.impressions);
          const clicks = toNumber(row.clicks);
          const cost = toNumber(row.cost);
          const leads = toNumber(row.leads);

          existing.impressions += impressions;
          existing.clicks += clicks;
          existing.cost += cost;
          existing.leads += leads;

          existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0;
          existing.cvr = existing.clicks > 0 ? (existing.leads / existing.clicks) * 100 : 0;
          existing.cpl = existing.leads > 0 ? existing.cost / existing.leads : 0;

          map.set(id, existing);
        });

        return Array.from(map.values()).sort((a, b) => b.leads - a.leads);
      };

      const campaigns = aggregateByKey('campaign').slice(0, 6);
      const creatives = aggregateByKey('creative').slice(0, 6);

      const latestUpdate = rows.reduce<string | null>((acc, row) => {
        const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;
        if (!updatedAt) return acc;
        if (!acc) return updatedAt;
        return updatedAt > acc ? updatedAt : acc;
      }, null);

      setTotals(totalsObj);
      setTopCampaigns(campaigns);
      setTopCreatives(creatives);
      setLastUpdated(latestUpdate);
      setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedTotals = useMemo(() => {
    if (!totals) return null;
    return [
      {
        title: 'Impressions',
        value: totals.impressions.toLocaleString('de-DE'),
        hint: 'Gesamte Reichweite aller Kampagnen',
      },
      {
        title: 'Spend',
        value: `€${totals.cost.toFixed(2)}`,
        hint: `${totals.clicks.toLocaleString('de-DE')} Clicks`,
      },
      {
        title: 'Leads',
        value: totals.leads.toLocaleString('de-DE'),
        hint: `CVR ${totals.cvr.toFixed(1)}%`,
      },
      {
        title: 'CPL',
        value: `€${totals.cpl.toFixed(2)}`,
        hint: `CTR ${totals.ctr.toFixed(1)}%`,
      },
    ];
  }, [totals]);

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-900/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All-Time Performance</h2>
            <p className="text-sm text-slate-200/70">Aggregierte Kennzahlen aus allen verfügbaren Tagen.</p>
          </div>
          {lastUpdated && (
            <span className="rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-xs text-slate-200/80">
              Letztes Update {new Date(lastUpdated).toLocaleString('de-DE')}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {formattedTotals?.map((metric) => (
            <div key={metric.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">{metric.title}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-3 text-xs text-slate-200/70">{metric.hint}</p>
            </div>
          ))}
          {loading && !formattedTotals && (
            <div className="col-span-full rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-200/70">
              Lade Kennzahlen…
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
          <h3 className="text-lg font-semibold text-white">Top Kampagnen</h3>
          <p className="text-xs text-slate-200/70">Sortiert nach Leads über den gesamten Zeitraum.</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-widest text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-right">Leads</th>
                  <th className="px-4 py-3 text-right">Spend</th>
                  <th className="px-4 py-3 text-right">CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading && topCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-200/70">
                      Lade Kampagnen…
                    </td>
                  </tr>
                )}
                {!loading && topCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-200/70">
                      Keine Kampagnen gefunden.
                    </td>
                  </tr>
                )}
                {topCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-200/10">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">{campaign.name}</div>
                      <div className="text-xs text-slate-200/70">Leads: {campaign.leads}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{campaign.leads.toLocaleString('de-DE')}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(campaign.cost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(campaign.cpl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
          <h3 className="text-lg font-semibold text-white">Top Creatives</h3>
          <p className="text-xs text-slate-200/70">Creatives mit den meisten Leads (all time).</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-widest text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Creative</th>
                  <th className="px-4 py-3 text-right">Leads</th>
                  <th className="px-4 py-3 text-right">Spend</th>
                  <th className="px-4 py-3 text-right">CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading && topCreatives.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-200/70">
                      Lade Creatives…
                    </td>
                  </tr>
                )}
                {!loading && topCreatives.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-200/70">
                      Keine Creatives gefunden.
                    </td>
                  </tr>
                )}
                {topCreatives.map((creative) => (
                  <tr key={creative.id} className="hover:bg-slate-200/10">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">{creative.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{creative.leads.toLocaleString('de-DE')}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(creative.cost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(creative.cpl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
        <h3 className="text-lg font-semibold text-white">Highlights</h3>
        <p className="text-xs text-slate-200/70">Schnelle Kennzahlen für Redaktion und Präsentationen.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">CTR (All-Time)</p>
            <p className="mt-2 text-lg font-semibold text-white">{totals ? `${totals.ctr.toFixed(2)}%` : '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">CVR (All-Time)</p>
            <p className="mt-2 text-lg font-semibold text-white">{totals ? `${totals.cvr.toFixed(2)}%` : '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">Spend pro Lead</p>
            <p className="mt-2 text-lg font-semibold text-white">{totals ? formatCurrency(totals.cpl) : '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">Gesamt Spend</p>
            <p className="mt-2 text-lg font-semibold text-white">{totals ? formatCurrency(totals.cost) : '—'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
