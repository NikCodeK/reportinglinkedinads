'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { supabase } from '@/lib/supabase';
import { LogEvent } from '@/types';
import { Plus, Calendar, DollarSign, Target, Image, FileText } from 'lucide-react';

type CampaignOption = { id: string; name: string | null };

type EventFormState = {
  type: LogEvent['type'];
  campaignId: string;
  description: string;
  value: string;
  createdBy: string;
};

const EVENT_TYPES: Array<{ value: LogEvent['type']; label: string; requiresValue?: boolean; icon: ComponentType<any> }> = [
  { value: 'budget_change', label: 'Budget Änderung', requiresValue: true, icon: DollarSign },
  { value: 'bid_change', label: 'Bid Änderung', requiresValue: true, icon: Target },
  { value: 'creative_rotation', label: 'Creative Rotation', icon: Image },
  { value: 'note', label: 'Notiz', icon: FileText },
  { value: 'campaign_created', label: 'Kampagne erstellt', icon: Plus },
  { value: 'campaign_paused', label: 'Kampagne pausiert', icon: Target },
  { value: 'budget_updated', label: 'Budget aktualisiert', requiresValue: true, icon: DollarSign },
  { value: 'bid_adjustment', label: 'Bid angepasst', requiresValue: true, icon: Target },
];

const DEFAULT_FORM_STATE: EventFormState = {
  type: 'note',
  campaignId: '',
  description: '',
  value: '',
  createdBy: 'Dima',
};

export default function LogbuchTab() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormState>(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [{ data: eventsData, error: eventsError }, { data: campaignsData, error: campaignsError }] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('fact_daily')
            .select('campaign_id, campaign_name')
            .limit(2000),
        ]);

        if (!isMounted) {
          return;
        }

        if (eventsError) {
          setError(`Events konnten nicht geladen werden: ${eventsError.message}`);
        } else {
          const mappedEvents = (eventsData || []).map((event) => ({
            id: event.id,
            type: event.type,
            campaignId: event.campaign_id || undefined,
            description: event.description,
            value: event.value !== null ? Number(event.value) : undefined,
            createdBy: event.created_by || undefined,
            createdAt: event.created_at,
          } satisfies LogEvent));

          setEvents(mappedEvents);
        }

        if (!campaignsError && campaignsData) {
          const campaigns = new Map<string, string | null>();
          campaignsData.forEach((row) => {
            if (row.campaign_id) {
              campaigns.set(row.campaign_id, row.campaign_name ?? null);
            }
          });
          setCampaignOptions(Array.from(campaigns.entries()).map(([id, name]) => ({ id, name })));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    const payload = {
      type: formData.type,
      campaign_id: formData.campaignId || null,
      description: formData.description,
      value: formData.value ? Number(formData.value) : null,
      created_by: formData.createdBy || 'System',
    };

    const { data, error: insertError } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .maybeSingle();

    if (insertError) {
      setError(`Event konnte nicht gespeichert werden: ${insertError.message}`);
      setSubmitting(false);
      return;
    }

    const newEvent: LogEvent = {
      id: data?.id,
      type: (data?.type || formData.type) as LogEvent['type'],
      campaignId: data?.campaign_id || undefined,
      description: data?.description || formData.description,
      value: data?.value !== null ? Number(data?.value) : undefined,
      createdAt: data?.created_at,
      createdBy: data?.created_by || formData.createdBy,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setFormData(DEFAULT_FORM_STATE);
    setShowForm(false);
    setSubmitting(false);
  };

  const getCampaignName = (campaignId?: string) => {
    if (!campaignId) {
      return null;
    }
    const campaign = campaignOptions.find((c) => c.id === campaignId);
    return campaign?.name || campaignId;
  };

  const formatEventValue = (event: LogEvent) => {
    if (event.value === undefined) {
      return '';
    }

    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    });

    return formatter.format(event.value);
  };

  const getEventIcon = (type: LogEvent['type']) => {
    const config = EVENT_TYPES.find((item) => item.value === type);
    return config?.icon ?? FileText;
  };

  const getEventLabel = (type: LogEvent['type']) => {
    const config = EVENT_TYPES.find((item) => item.value === type);
    return config?.label ?? type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logbuch</h2>
          <p className="text-gray-600 mt-1">Verfolgen Sie alle Änderungen und Notizen zu Ihren Kampagnen</p>
        </div>
        <button
          onClick={() => {
            setFormData(DEFAULT_FORM_STATE);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Event hinzufügen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Neues Event hinzufügen</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Typ</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value as LogEvent['type'];
                      const requiresValue = EVENT_TYPES.find((entry) => entry.value === type)?.requiresValue;
                      setFormData((prev) => ({
                        ...prev,
                        type,
                        value: requiresValue ? prev.value : '',
                      }));
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  >
                    {EVENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kampagne (optional)</label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, campaignId: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  >
                    <option value="">Alle Kampagnen</option>
                    {campaignOptions.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name || campaign.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full h-20"
                    placeholder="Beschreiben Sie das Event..."
                    required
                  />
                </div>

                {EVENT_TYPES.find((entry) => entry.value === formData.type)?.requiresValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wert (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                      placeholder="z.B. 1000"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Erstellt von</label>
                  <input
                    type="text"
                    value={formData.createdBy}
                    onChange={(e) => setFormData((prev) => ({ ...prev, createdBy: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Speichere…' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {loading && (
          <div className="px-6 py-4 text-sm text-blue-600">Events werden geladen…</div>
        )}
        {!loading && events.length === 0 && (
          <div className="px-6 py-4 text-sm text-gray-500">Noch keine Events vorhanden.</div>
        )}
        {events.map((event) => {
          const Icon = getEventIcon(event.type);
          const campaignName = getCampaignName(event.campaignId);
          return (
            <div key={event.id} className="px-6 py-4 flex items-start space-x-4">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600">
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{getEventLabel(event.type)}</h4>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {event.createdAt ? new Date(event.createdAt).toLocaleString('de-DE') : 'Unbekannt'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {campaignName && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      Kampagne: {campaignName}
                    </span>
                  )}
                  {event.value !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      Wert: {formatEventValue(event)}
                    </span>
                  )}
                  {event.createdBy && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      Von: {event.createdBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
