# LinkedIn Ads Dashboard MVP

Ein Next.js Dashboard für wöchentliche LinkedIn Ads Reports mit Tailwind CSS und Supabase.

## 🎯 Ziel

Zentrale Oberfläche für wöchentliche LinkedIn Ads KPI-Reports statt Excel-Tabellen oder langen Text-Reports. Das Dashboard dient als Arbeitsoberfläche für Dima zur schnellen Dateneinsicht, Vergleich und Entscheidungsableitung.

## ✨ Features

### 🔐 Authentication
- Einfache Passwort-Authentifizierung über ENV-Variable

### 📊 Tabs Navigation
- **Daily**: Tabelle mit KPIs (Date, Campaign, Creative, Impressions, Clicks, Cost, Leads, CTR, CPC, CPM, CVR, CPL)
- **Weekly**: Übersicht einer Woche mit TL;DR, Charts und Empfehlungen
- **Deep Dive**: Creative-Leaderboard mit besten/schlechtsten CPL Performance
- **Logbuch**: Event-Tracking mit Timeline

### 📈 Charts & Visualisierung
- Recharts Integration für:
  - Impressions/Clicks/Spend
  - CPL & CVR Entwicklung
  - CTR & CPM Entwicklung

### 🎯 Empfehlungen System
- Automatische Empfehlungen mit Akzeptieren/Ablehnen Buttons
- Impact-Bewertung (High/Medium/Low)
- Publish-Funktion für Weekly Snapshots

### 📝 Event Tracking
- Budget Änderungen
- Bid Änderungen
- Creative Rotationen
- Notizen
- Timeline-Ansicht

## 🚀 Setup

### Voraussetzungen
- Node.js 18+
- npm oder yarn

### Installation

1. **Repository klonen**
```bash
git clone <repository-url>
cd linkedin-ads-dashboard
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Environment konfigurieren**
```bash
cp .env.example .env.local
```

Bearbeiten Sie `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=service_role_key_from_supabase

# Auth & Webhooks
NEXT_PUBLIC_DASHBOARD_PASSWORD=admin123
N8N_INGEST_TOKEN=shared_secret_for_n8n
```

4. **Development Server starten**
```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## 🗄️ Supabase Setup

### Database Schema

```sql
create extension if not exists "uuid-ossp";

create table if not exists fact_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  campaign_id text not null,
  creative_id text,
  campaign_name text,
  creative_name text,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  cost numeric(12,2) not null default 0,
  leads bigint not null default 0,
  ctr numeric(9,6) not null default 0,
  cpc numeric(12,4) not null default 0,
  cpm numeric(12,4) not null default 0,
  cvr numeric(9,6) not null default 0,
  cpl numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  creative_key text generated always as (coalesce(creative_id, '')) stored,
  unique (date, campaign_id, creative_key)
);

create table if not exists weekly_briefings (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  insights jsonb not null default '[]'::jsonb,
  kpi_comparisons jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  raw_payload jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_start)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('budget_change', 'bid_change', 'creative_rotation', 'note', 'campaign_created', 'campaign_paused', 'budget_updated', 'bid_adjustment')) not null,
  campaign_id text,
  description text not null,
  value numeric(12,2),
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists fact_daily_date_idx on fact_daily(date desc);
create index if not exists fact_daily_campaign_idx on fact_daily(campaign_id);
create index if not exists weekly_briefings_status_idx on weekly_briefings(status);
```

### Datenfluss & n8n

1. **LinkedIn → n8n**: n8n sammelt die täglichen/wöchentlichen KPIs direkt aus der LinkedIn Ads API oder einem Export.
2. **n8n → Dashboard**: Über einen HTTP Request Node sendet n8n die Payload (Felder `dailyMetrics` und optional `weeklyBriefing`) an `POST /api/n8n-ingest` mit Header `Authorization: Bearer $N8N_INGEST_TOKEN`.
3. **Persistenz**: Die API validiert das Token, schreibt Daily-KPIs in `fact_daily` und speichert das Briefing in `weekly_briefings`.
4. **UI**: Das Dashboard liest alle Daten live aus Supabase – keine Mockdaten mehr notwendig.
5. **Publish**: Der Publish-Button im Weekly Tab aktualisiert den Status (`draft` → `published`) und kann weitere Automationen (z.B. n8n Workflows) auslösen.

## 🎨 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Supabase
- **Date Handling**: date-fns

## 📱 Responsive Design

Das Dashboard ist vollständig responsive und funktioniert auf:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🔧 Development

### Verfügbare Scripts

```bash
npm run dev      # Development Server
npm run build    # Production Build
npm run start    # Production Server
npm run lint     # ESLint Check
```

### Projektstruktur

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global Styles
│   ├── layout.tsx      # Root Layout
│   └── page.tsx        # Main Page
├── components/         # React Components
│   ├── Auth.tsx        # Authentication
│   ├── Navigation.tsx  # Tab Navigation
│   ├── DailyTab.tsx    # Daily KPIs
│   ├── WeeklyTab.tsx   # Weekly Reports
│   ├── DeepDiveTab.tsx # Creative Analysis
│   └── LogbuchTab.tsx  # Event Tracking
├── lib/               # Utilities
│   ├── supabase.ts    # Supabase Client (browser)
│   └── server/        # Supabase Admin helpers
└── types/             # TypeScript Types
    └── index.ts       # Type Definitions
```

## 🚀 Deployment

### Vercel (Empfohlen)

1. Repository zu Vercel verbinden
2. Environment Variables setzen
3. Deploy

### Andere Plattformen

```bash
npm run build
npm run start
```

## 🔮 Roadmap

### Phase 1 (MVP) ✅
- [x] Basic UI mit Tabs
- [x] Supabase-Datenanbindung & n8n Webhook
- [x] Charts & Visualisierung
- [x] Event Tracking

### Phase 2 (Production)
- [ ] Echte LinkedIn Ads API Integration
- [ ] Automatische Daten-Synchronisation
- [ ] Erweiterte Filter & Suchfunktionen
- [ ] Email Reports

### Phase 3 (Advanced)
- [ ] Automatisierte Empfehlungen
- [ ] A/B Testing Integration
- [ ] Team Collaboration Features
- [ ] Advanced Analytics

## 📞 Support

Bei Fragen oder Problemen:
1. Check README & Dokumentation
2. Überprüfen Sie die Console für Fehler
3. Stellen Sie sicher, dass alle Dependencies installiert sind

## 📄 Lizenz

Private Projekt für interne Nutzung.
