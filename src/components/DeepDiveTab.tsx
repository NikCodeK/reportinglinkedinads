'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyKPI, FilterOptions, CreativePerformanceStats } from '@/types';
import { Award, AlertTriangle } from 'lucide-react';

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const toISODate = (date: Date) => date.toISOString().slice(0, 10);

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

        if (!isMounted) {
          return;
        }

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

  const getCampaignName = (campaignId: string | null | undefined) => {
    if (!campaignId) {
      return 'Alle Kampagnen';
    }
    const campaign = campaignOptions.find((c) => c.id === campaignId);
    return campaign?.name || campaignId;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: value },
                  }));
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: value },
                  }));
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kampagne</label>
            <select
              multiple
              value={filters.campaignIds || []}
              onChange={(e) => {
                const selectedIds = Array.from(e.target.selectedOptions, (option) => option.value);
                setFilters((prev) => ({
                  ...prev,
                  campaignIds: selectedIds,
                }));
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
              size={3}
            >
              {campaignOptions.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name || campaign.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading && <p className="mt-4 text-sm text-blue-600">Lade KPIs…</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg font-semibold text-green-900 flex items-center">
              <Award className="w-5 h-5 mr-2" /> Beste CPL Performance
            </h3>
            <p className="text-sm text-green-700 mt-1">Top 3 Creatives mit niedrigsten Kosten pro Lead</p>
          </div>
          <div className="p-6">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Creatives im ausgewählten Zeitraum.</p>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((creative, index) => (
                  <div key={creative.key} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-medium text-green-900">{creative.creativeName}</h4>
                            <p className="text-xs text-green-700">{getCampaignName(creative.campaignId)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-green-600 font-medium">CPL:</span>
                            <span className="ml-1 text-green-900">€{creative.cpl.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">Leads:</span>
                            <span className="ml-1 text-green-900">{creative.leads}</span>
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">CVR:</span>
                            <span className="ml-1 text-green-900">{creative.cvr.toFixed(2)}%</span>
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">CTR:</span>
                            <span className="ml-1 text-green-900">{creative.ctr.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Verbesserungspotential
            </h3>
            <p className="text-sm text-red-700 mt-1">3 Creatives mit höchsten Kosten pro Lead</p>
          </div>
          <div className="p-6">
            {bottomPerformers.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Creatives im ausgewählten Zeitraum.</p>
            ) : (
              <div className="space-y-4">
                {bottomPerformers.map((creative, index) => (
                  <div key={creative.key} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-medium text-red-900">{creative.creativeName}</h4>
                            <p className="text-xs text-red-700">{getCampaignName(creative.campaignId)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-red-600 font-medium">CPL:</span>
                            <span className="ml-1 text-red-900">€{creative.cpl.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-red-600 font-medium">Leads:</span>
                            <span className="ml-1 text-red-900">{creative.leads}</span>
                          </div>
                          <div>
                            <span className="text-red-600 font-medium">CVR:</span>
                            <span className="ml-1 text-red-900">{creative.cvr.toFixed(2)}%</span>
                          </div>
                          <div>
                            <span className="text-red-600 font-medium">CTR:</span>
                            <span className="ml-1 text-red-900">{creative.ctr.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
