'use client';

import { useState } from 'react';
import { mockEvents, mockCampaigns } from '@/lib/mockData';
import { LogEvent } from '@/types';
import { Plus, Calendar, DollarSign, Target, Image, FileText } from 'lucide-react';

export default function LogbuchTab() {
  const [events, setEvents] = useState<LogEvent[]>(mockEvents);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'note' as LogEvent['type'],
    campaignId: '',
    description: '',
    value: '',
    createdBy: 'Dima'
  });

  const eventIcons = {
    budget_change: DollarSign,
    bid_change: Target,
    creative_rotation: Image,
    note: FileText,
    campaign_created: Plus,
    campaign_paused: Target,
    budget_updated: DollarSign,
    bid_adjustment: Target
  };

  const eventLabels = {
    budget_change: 'Budget Änderung',
    bid_change: 'Bid Änderung',
    creative_rotation: 'Creative Rotation',
    note: 'Notiz',
    campaign_created: 'Kampagne erstellt',
    campaign_paused: 'Kampagne pausiert',
    budget_updated: 'Budget aktualisiert',
    bid_adjustment: 'Bid angepasst'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: LogEvent = {
      id: `event-${Date.now()}`,
      type: formData.type,
      campaignId: formData.campaignId || undefined,
      description: formData.description,
      value: formData.value ? parseFloat(formData.value) : undefined,
      createdAt: new Date().toISOString(),
      createdBy: formData.createdBy
    };

    setEvents(prev => [newEvent, ...prev]);
    setFormData({
      type: 'note',
      campaignId: '',
      description: '',
      value: '',
      createdBy: 'Dima'
    });
    setShowForm(false);
  };

  const getCampaignName = (campaignId?: string) => {
    if (!campaignId) return null;
    return mockCampaigns.find(c => c.id === campaignId)?.name || 'Unknown Campaign';
  };

  const formatEventValue = (event: LogEvent) => {
    if (!event.value) return '';
    
    switch (event.type) {
      case 'budget_change':
      case 'budget_updated':
        return event.value > 0 ? `+€${event.value.toFixed(2)}` : `€${event.value.toFixed(2)}`;
      case 'bid_change':
      case 'bid_adjustment':
        return event.value > 0 ? `+€${event.value.toFixed(2)}` : `€${event.value.toFixed(2)}`;
      default:
        return '';
    }
  };

  const getEventColor = (type: LogEvent['type']) => {
    switch (type) {
      case 'budget_change': return 'bg-green-100 text-green-800 border-green-200';
      case 'bid_change': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creative_rotation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'note': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'campaign_created': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'campaign_paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'budget_updated': return 'bg-green-100 text-green-800 border-green-200';
      case 'bid_adjustment': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logbuch</h2>
          <p className="text-gray-600 mt-1">Verfolgen Sie alle Änderungen und Notizen zu Ihren Kampagnen</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Event hinzufügen
        </button>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Neues Event hinzufügen</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Typ
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as LogEvent['type'],
                      value: e.target.value === 'note' ? '' : prev.value // Clear value for notes
                    }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  >
                    <option value="budget_change">Budget Änderung</option>
                    <option value="bid_change">Bid Änderung</option>
                    <option value="creative_rotation">Creative Rotation</option>
                    <option value="note">Notiz</option>
                    <option value="campaign_created">Kampagne erstellt</option>
                    <option value="campaign_paused">Kampagne pausiert</option>
                    <option value="budget_updated">Budget aktualisiert</option>
                    <option value="bid_adjustment">Bid angepasst</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kampagne (optional)
                  </label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  >
                    <option value="">Alle Kampagnen</option>
                    {mockCampaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.type === 'budget_change' || formData.type === 'bid_change') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wert {formData.type === 'budget_change' ? '(€)' : '(€)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                      placeholder={formData.type === 'budget_change' ? 'z.B. 1000' : 'z.B. 0.30'}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full h-20"
                    placeholder="Beschreiben Sie das Event..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Events Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          <p className="text-sm text-gray-600 mt-1">{events.length} Events</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {events.map((event) => {
              const Icon = eventIcons[event.type];
              return (
                <div key={event.id} className="relative">
                  {/* Timeline line */}
                  {event !== events[events.length - 1] && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                  )}
                  
                  <div className="relative flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${getEventColor(event.type)} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                          {eventLabels[event.type]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {event.createdAt ? new Date(event.createdAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Kein Datum'}
                        </span>
                        {event.campaignId && (
                          <span className="text-sm text-blue-600 font-medium">
                            {getCampaignName(event.campaignId)}
                          </span>
                        )}
                        {formatEventValue(event) && (
                          <span className="text-sm font-bold text-gray-900">
                            {formatEventValue(event)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Erstellt von {event.createdBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {events.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Events vorhanden</h3>
              <p className="text-gray-500 mb-4">Fügen Sie Ihr erstes Event hinzu, um die Timeline zu starten.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Erstes Event hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Budget Änderungen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events.filter(e => e.type === 'budget_change').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bid Änderungen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events.filter(e => e.type === 'bid_change').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image className="w-8 h-8 text-purple-600" alt="Creative Rotation Icon" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Creative Rotationen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events.filter(e => e.type === 'creative_rotation').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Notizen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events.filter(e => e.type === 'note').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


