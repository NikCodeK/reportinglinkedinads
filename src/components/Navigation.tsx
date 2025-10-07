'use client';

import { BarChart3, Calendar, Search, FileText, Sparkles, Shield } from 'lucide-react';

export type TabType = 'daily' | 'weekly' | 'deep-dive' | 'logbuch';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'daily' as TabType, label: 'Daily', description: 'KPIs & Trends', icon: Calendar },
    { id: 'weekly' as TabType, label: 'Weekly', description: 'Briefing & Actions', icon: BarChart3 },
    { id: 'deep-dive' as TabType, label: 'Deep Dive', description: 'Creative Insights', icon: Search },
    { id: 'logbuch' as TabType, label: 'Logbuch', description: 'Änderungen & Notes', icon: FileText },
  ];

  return (
    <nav className="relative border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-slate-500 via-slate-300 to-slate-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-slate-300 to-slate-100 shadow-lg shadow-slate-900/40">
              <Shield className="h-6 w-6 text-slate-900" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Thierhoff LinkedIn Center</h1>
              <p className="text-sm text-slate-300">Enterprise Analytics &amp; Execution für LinkedIn Kampagnen.</p>
            </div>
          </div>

          <div className="mt-6 sm:mt-0">
            <div className="flex rounded-full border border-white/5 bg-slate-900/80 p-2 text-xs text-slate-200 shadow-inner shadow-slate-900/40">
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-800/60 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live · Supabase & n8n autosync
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-200/10 px-4 py-2 text-slate-100">
                <Sparkles className="h-4 w-4" />
                Weekly Briefing bereit
              </div>
            </div>
          </div>
        </div>

        <div className="relative -mb-px flex flex-wrap gap-3 pb-5 text-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group flex w-full flex-1 min-w-[170px] items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition ${
                  isActive
                    ? 'border-slate-300/60 bg-slate-100/10 shadow-lg shadow-slate-900/20'
                    : 'border-white/10 bg-white/[0.03] hover:border-slate-300/40 hover:bg-slate-100/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      isActive
                        ? 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-50 text-slate-900'
                        : 'bg-slate-900 text-slate-300 group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {tab.label}
                    </span>
                    <span className={`block text-xs ${isActive ? 'text-slate-200/80' : 'text-slate-400 group-hover:text-slate-200/80'}`}>
                      {tab.description}
                    </span>
                  </span>
                </span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

