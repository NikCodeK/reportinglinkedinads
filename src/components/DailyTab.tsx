'use client';

import { useEffect, useMemo, useState } from 'react';
import { mockDailyKPIs, mockCampaigns, mockCreatives } from '@/lib/mockData';
import { FilterOptions } from '@/types';

const ITEMS_PER_PAGE = 25;

export default function DailyTab() {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: '2024-01-15',
      end: '2024-01-21'
    },
    campaignIds: []
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredKPIs = useMemo(() => {
    return mockDailyKPIs.filter(kpi => {
      const dateInRange = kpi.date >= filters.dateRange.start && kpi.date <= filters.dateRange.end;
      const campaignMatch = !filters.campaignIds || filters.campaignIds.length === 0 || filters.campaignIds.includes(kpi.campaignId);
      return dateInRange && campaignMatch;
    });
  }, [filters]);

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
    return mockCampaigns.find(c => c.id === campaignId)?.name || 'Unknown Campaign';
  };

  const getCreativeName = (creativeId: string) => {
    return mockCreatives.find(c => c.id === creativeId)?.name || 'Unknown Creative';
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
              {mockCampaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
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
              {paginatedKPIs.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(kpi.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCampaignName(kpi.campaignId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCreativeName(kpi.creativeId)}
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

