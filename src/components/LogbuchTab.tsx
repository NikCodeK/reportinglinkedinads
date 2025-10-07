'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { supabase } from '@/lib/supabase';
import { LogEvent } from '@/types';
import { Plus, Calendar, DollarSign, Target, Image, FileText, Sparkles } from 'lucide-react';

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

        if (!isMounted) return;

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
    if (!campaignId) return null;
    const campaign = campaignOptions.find((c) => c.id === campaignId);
    return campaign?.name || campaignId;
  };

  const formatEventValue = (event: LogEvent) => {
    if (event.value === undefined) return '';

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
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5 text-blue-100" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Logbuch & Timeline</h2>
              <p className="text-sm text-blue-100/70">Dokumentiere Budget-Änderungen, Tests und Learnings.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData(DEFAULT_FORM_STATE);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/20"
          >
            <Plus className="h-4 w-4" /> Event hinzufügen
          </button>
        </div>
        <p className="mt-3 text-xs text-blue-100/70">
          {loading ? 'Lade Ereignisse…' : `${events.length} Einträge erfasst`}
        </p>
        {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Neues Event hinzufügen</h3>
                <p className="text-xs text-blue-100/70">Halte Optimierungen und Hypothesen strukturiert fest.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100/70"
              >
                Schließen
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
                  Event Typ
                </label>
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
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {EVENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
                  Kampagne (optional)
                </label>
                <select
                  value={formData.campaignId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, campaignId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Alle Kampagnen</option>
                  {campaignOptions.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name || campaign.id}
                    </option>
                  ))}
                </select>
              </div>

              {EVENT_TYPES.find((entry) => entry.value === formData.type)?.requiresValue && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
                    Wert (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="z.B. 250"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="h-24 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Beschreibe Maßnahme, Ziel oder Hypothese"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-100/80">
                  Erstellt von
                </label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createdBy: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 hover:border-blue-400/40"
                  disabled={submitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-blue-400/50 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-500/20 disabled:opacity-40"
                  disabled={submitting}
                >
                  {submitting ? 'Speichere…' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-inner shadow-slate-900/40">
        {loading && (
          <div className="px-6 py-4 text-sm text-blue-100/70">Events werden geladen…</div>
        )}
        {!loading && events.length === 0 && (
          <div className="px-6 py-4 text-sm text-blue-100/70">Noch keine Events vorhanden.</div>
        )}
        {events.map((event) => {
          const Icon = getEventIcon(event.type);
          const campaignName = getCampaignName(event.campaignId);
          return (
            <div key={event.id} className="flex items-start gap-4 border-b border-white/5 px-6 py-4 last:border-none">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <Icon className="h-5 w-5 text-blue-100" />
              </span>
              <div className="flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-sm font-semibold text-white">{getEventLabel(event.type)}</h4>
                  <span className="flex items-center gap-2 text-xs text-blue-100/70">
                    <Calendar className="h-3 w-3" />
                    {event.createdAt ? new Date(event.createdAt).toLocaleString('de-DE') : 'Unbekannt'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-blue-100/80">{event.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-100/70">
                  {campaignName && (
                    <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
                      Kampagne: {campaignName}
                    </span>
                  )}
                  {event.value !== undefined && (
                    <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
                      Wert: {formatEventValue(event)}
                    </span>
                  )}
                  {event.createdBy && (
                    <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
                      Von: {event.createdBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
