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

# Basic Auth
NEXT_PUBLIC_DASHBOARD_PASSWORD=admin123
```

4. **Development Server starten**
```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## 🗄️ Supabase Setup

### Database Schema

```sql
-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  budget DECIMAL(10,2) NOT NULL,
  objective TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creatives
CREATE TABLE creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video', 'carousel')) NOT NULL,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  cta TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily KPIs
CREATE TABLE fact_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES creatives(id) ON DELETE CASCADE,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(5,2) NOT NULL DEFAULT 0,
  cpc DECIMAL(5,2) NOT NULL DEFAULT 0,
  cpm DECIMAL(5,2) NOT NULL DEFAULT 0,
  cvr DECIMAL(5,2) NOT NULL DEFAULT 0,
  cpl DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, campaign_id, creative_id)
);

-- Weekly Snapshots
CREATE TABLE weekly_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('budget_change', 'bid_change', 'creative_rotation', 'note')) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  value DECIMAL(10,2),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

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
│   ├── supabase.ts    # Supabase Client
│   └── mockData.ts    # Mock Data
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
- [x] Mock Data Integration
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


