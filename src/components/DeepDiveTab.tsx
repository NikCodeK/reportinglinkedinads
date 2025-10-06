'use client';

import { useState, useMemo } from 'react';
import { mockDailyKPIs, mockCampaigns, mockCreatives } from '@/lib/mockData';
import { FilterOptions } from '@/types';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

export default function DeepDiveTab() {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: '2024-01-15',
      end: '2024-01-21'
    },
    campaignIds: []
  });

  // Calculate creative performance
  const creativePerformance = useMemo(() => {
    const filteredKPIs = mockDailyKPIs.filter(kpi => {
      const dateInRange = kpi.date >= filters.dateRange.start && kpi.date <= filters.dateRange.end;
      const campaignMatch = !filters.campaignIds || filters.campaignIds.length === 0 || filters.campaignIds.includes(kpi.campaignId);
      return dateInRange && campaignMatch;
    });

    const creativeStats = filteredKPIs.reduce((acc, kpi) => {
      if (!acc[kpi.creativeId]) {
        acc[kpi.creativeId] = {
          creativeId: kpi.creativeId,
          impressions: 0,
          clicks: 0,
          cost: 0,
          leads: 0,
          ctr: 0,
          cpc: 0,
          cvr: 0,
          cpl: 0,
          count: 0
        };
      }
      
      acc[kpi.creativeId].impressions += kpi.impressions;
      acc[kpi.creativeId].clicks += kpi.clicks;
      acc[kpi.creativeId].cost += kpi.cost;
      acc[kpi.creativeId].leads += kpi.leads;
      acc[kpi.creativeId].count += 1;
      
      return acc;
    }, {} as any);

    // Calculate averages
    Object.values(creativeStats).forEach((stats: any) => {
      stats.ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions * 100) : 0;
      stats.cpc = stats.clicks > 0 ? (stats.cost / stats.clicks) : 0;
      stats.cvr = stats.clicks > 0 ? (stats.leads / stats.clicks * 100) : 0;
      stats.cpl = stats.leads > 0 ? (stats.cost / stats.leads) : 0;
    });

    return Object.values(creativeStats).sort((a: any, b: any) => a.cpl - b.cpl);
  }, [filters]);

  const getCreativeInfo = (creativeId: string) => {
    return mockCreatives.find(c => c.id === creativeId);
  };

  const getCampaignName = (campaignId: string) => {
    return mockCampaigns.find(c => c.id === campaignId)?.name || 'Unknown Campaign';
  };

  // Get top and bottom performers
  const topPerformers = creativePerformance.slice(0, 3);
  const bottomPerformers = creativePerformance.slice(-3).reverse();

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
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg font-semibold text-green-900 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Beste CPL Performance
            </h3>
            <p className="text-sm text-green-700 mt-1">Top 3 Creatives mit niedrigsten Kosten pro Lead</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topPerformers.map((creative: any, index) => {
                const creativeInfo = getCreativeInfo(creative.creativeId);
                return (
                  <div key={creative.creativeId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-medium text-green-900">
                            {creativeInfo?.name || 'Unknown Creative'}
                          </h4>
                        </div>
                        <p className="text-xs text-green-700 mb-3">
                          {creativeInfo?.headline || 'No headline available'}
                        </p>
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
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Verbesserungspotential
            </h3>
            <p className="text-sm text-red-700 mt-1">3 Creatives mit höchsten Kosten pro Lead</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bottomPerformers.map((creative: any, index) => {
                const creativeInfo = getCreativeInfo(creative.creativeId);
                return (
                  <div key={creative.creativeId} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-medium text-red-900">
                            {creativeInfo?.name || 'Unknown Creative'}
                          </h4>
                        </div>
                        <p className="text-xs text-red-700 mb-3">
                          {creativeInfo?.headline || 'No headline available'}
                        </p>
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
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Creative Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Vollständiges Creative-Leaderboard</h3>
          <p className="text-sm text-gray-600 mt-1">Sortiert nach CPL (aufsteigend)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creative
                </th>
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
                  CVR (%)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPL (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creativePerformance.map((creative: any, index) => {
                const creativeInfo = getCreativeInfo(creative.creativeId);
                const campaignName = creativeInfo ? getCampaignName(creativeInfo.campaignId) : 'Unknown';
                
                return (
                  <tr key={creative.creativeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <Award className="w-4 h-4 text-yellow-500 mr-2" />
                        ) : index >= creativePerformance.length - 3 ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                        ) : null}
                        #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {creativeInfo?.name || 'Unknown Creative'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {creativeInfo?.type || 'Unknown Type'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaignName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {creative.impressions.toLocaleString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {creative.clicks.toLocaleString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      €{creative.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {creative.leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {creative.ctr.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {creative.cvr.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <span className={`font-medium ${index < 3 ? 'text-green-600' : index >= creativePerformance.length - 3 ? 'text-red-600' : ''}`}>
                        €{creative.cpl.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔍 Key Insights</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <span>
              <strong>Beste Performance:</strong> {topPerformers.length > 0 && getCreativeInfo(topPerformers[0].creativeId)?.name} 
              mit €{topPerformers.length > 0 && topPerformers[0].cpl.toFixed(2)} CPL
            </span>
          </li>
          <li className="flex items-start">
            <TrendingDown className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <span>
              <strong>Verbesserungspotential:</strong> {bottomPerformers.length > 0 && getCreativeInfo(bottomPerformers[0].creativeId)?.name} 
              mit €{bottomPerformers.length > 0 && bottomPerformers[0].cpl.toFixed(2)} CPL
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-0.5">📊</span>
            <span>
              <strong>Durchschnittliche CPL:</strong> €{(creativePerformance.length > 0 ? creativePerformance.reduce((sum, c) => sum + c.cpl, 0) / creativePerformance.length : 0).toFixed(2)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}


