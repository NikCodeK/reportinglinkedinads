'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockWeeklySnapshots, mockDailyKPIs, mockCampaigns, mockCreatives } from '@/lib/mockData';
import { WeeklyData } from '@/types';
import { CheckCircle, XCircle, Download, FileText } from 'lucide-react';

export default function WeeklyTab() {
  const [currentSnapshot] = useState(mockWeeklySnapshots[0]);
  const [recommendations, setRecommendations] = useState(currentSnapshot.recommendations);

  // Aggregate data for charts
  const weeklyData = mockDailyKPIs.reduce((acc, kpi) => {
    const date = kpi.date;
    if (!acc[date]) {
      acc[date] = {
        date: new Date(date).toLocaleDateString('de-DE', { weekday: 'short' }),
        impressions: 0,
        clicks: 0,
        cost: 0,
        cpl: 0,
        cvr: 0,
        ctr: 0,
        cpm: 0
      };
    }
    acc[date].impressions += kpi.impressions;
    acc[date].clicks += kpi.clicks;
    acc[date].cost += kpi.cost;
    acc[date].cpl = (acc[date].cost / (acc[date].clicks * acc[date].cvr / 100)) || 0;
    acc[date].cvr = ((acc[date].clicks * acc[date].cvr / 100) / acc[date].clicks * 100) || 0;
    acc[date].ctr = (acc[date].clicks / acc[date].impressions * 100) || 0;
    acc[date].cpm = (acc[date].cost / acc[date].impressions * 1000) || 0;
    return acc;
  }, {} as Record<string, WeeklyData>);

  const chartData = Object.values(weeklyData);

  // Campaign performance data
  const campaignPerformance = mockCampaigns.map(campaign => {
    const campaignKPIs = mockDailyKPIs.filter(kpi => kpi.campaignId === campaign.id);
    const totalImpressions = campaignKPIs.reduce((sum, kpi) => sum + kpi.impressions, 0);
    const totalClicks = campaignKPIs.reduce((sum, kpi) => sum + kpi.clicks, 0);
    const totalCost = campaignKPIs.reduce((sum, kpi) => sum + kpi.cost, 0);
    const totalLeads = campaignKPIs.reduce((sum, kpi) => sum + kpi.leads, 0);
    
    return {
      name: campaign.name,
      impressions: totalImpressions,
      clicks: totalClicks,
      cost: totalCost,
      leads: totalLeads,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0,
      cpc: totalClicks > 0 ? (totalCost / totalClicks) : 0,
      cpl: totalLeads > 0 ? (totalCost / totalLeads) : 0,
      cvr: totalClicks > 0 ? (totalLeads / totalClicks * 100) : 0
    };
  });

  const handleRecommendationAction = (recId: string, action: 'accepted' | 'rejected') => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === recId 
          ? { ...rec, status: action }
          : rec
      )
    );
  };

  const handlePublish = () => {
    alert('Weekly Snapshot wurde veröffentlicht!');
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    alert(`${format.toUpperCase()} Export wird vorbereitet...`);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* TL;DR Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">📊 TL;DR - Diese Woche</h2>
        <ul className="space-y-2">
          {currentSnapshot.insights.map((insight, index) => (
            <li key={index} className="text-blue-800 flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions/Clicks/Spend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Impressions, Clicks & Spend
          </h3>
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
        </div>

        {/* CPL & CVR Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            CPL & CVR Entwicklung
          </h3>
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
        </div>
      </div>

      {/* CTR & CPM Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          CTR & CPM Entwicklung
        </h3>
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
      </div>

      {/* Campaign Performance Table */}
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
              {campaignPerformance.map((campaign) => (
                <tr key={campaign.name} className="hover:bg-gray-50">
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
                    €{campaign.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {campaign.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {campaign.ctr.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    €{campaign.cpl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Empfehlungen</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{rec.action}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(rec.impact)}`}>
                        {rec.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rec.reasoning}</p>
                    <div className="flex space-x-2">
                      {rec.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRecommendationAction(rec.id, 'accepted')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Akzeptieren
                          </button>
                          <button
                            onClick={() => handleRecommendationAction(rec.id, 'rejected')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Ablehnen
                          </button>
                        </>
                      )}
                      {rec.status === 'accepted' && (
                        <span className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-800 bg-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Akzeptiert
                        </span>
                      )}
                      {rec.status === 'rejected' && (
                        <span className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-800 bg-red-100">
                          <XCircle className="w-3 h-3 mr-1" />
                          Abgelehnt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow">
        <div className="flex space-x-3">
          <button
            onClick={handlePublish}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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


