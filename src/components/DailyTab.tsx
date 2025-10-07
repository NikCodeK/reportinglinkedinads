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
    campaignIds: []
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

      if (!isMounted) {
        return;
      }

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
    if (!filters.dateRange.start || !filters.dateRange.end || !initialized) {
      return;
    }

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

        if (!isMounted) {
          return;
        }

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
          if (!item.updatedAt) {
            return acc;
          }
          if (!acc) {
            return item.updatedAt;
          }
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
  }, [filters]);

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

  const getCampaignName = (campaignId: string) => {
    const campaign = campaignOptions.find(c => c.id === campaignId);
    return campaign?.name || campaignId;
  };

  const getCreativeName = (creativeId?: string | null, fallbackName?: string | null) => {
    if (fallbackName) {
      return fallbackName;
    }
    return creativeId || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeitraum
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => {
                  const value = e.target.value;
                  setCurrentPage(1);
                  setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: value }
                  }));
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => {
                  const value = e.target.value;
                  setCurrentPage(1);
                  setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: value }
                  }));
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kampagne
            </label>
            <select
              multiple
              value={filters.campaignIds || []}
              onChange={(e) => {
                const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                setCurrentPage(1);
                setFilters(prev => ({ ...prev, campaignIds: selectedIds }));
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
              size={3}
            >
              {campaignOptions.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name || campaign.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          {lastUpdated ? (
            <span>Letztes Update: {new Date(lastUpdated).toLocaleDateString('de-DE')}</span>
          ) : (
            <span>Keine Daten im gewählten Zeitraum</span>
          )}
          {loading && <span className="text-blue-600">Lade Daten…</span>}
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Daily KPIs ({filteredKPIs.length} Einträge)
          </h2>
        </div>
        <div className="overflow-x-auto">
          {error && (
            <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
              Fehler beim Laden der Daten: {error}
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creative
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
                  CPC (€)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPM (€)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CVR (%)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPL (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!loading && paginatedKPIs.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-sm text-gray-500">
                    Keine KPI-Daten im ausgewählten Zeitraum gefunden.
                  </td>
                </tr>
              )}
              {paginatedKPIs.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(kpi.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCampaignName(kpi.campaignId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCreativeName(kpi.creativeId, kpi.creativeName)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {kpi.impressions.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {kpi.clicks.toLocaleString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    €{kpi.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {kpi.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {kpi.ctr.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    €{kpi.cpc.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    €{kpi.cpm.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {kpi.cvr.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    €{kpi.cpl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!hasResults || currentPage === 1}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <span className="text-sm text-gray-600">
            Seite {hasResults ? currentPage : 0} von {hasResults ? totalPages : 0}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={!hasResults || currentPage >= totalPages}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
}
