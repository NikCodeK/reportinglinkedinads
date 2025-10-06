# 🚀 Quick Start Guide

## Sofort loslegen (ohne Node.js Installation)

Das Dashboard ist bereits vollständig konfiguriert und kann sofort verwendet werden, sobald Node.js installiert ist.

### 1. Node.js installieren

**macOS:**
```bash
# Mit Homebrew
brew install node

# Oder von https://nodejs.org/ herunterladen
```

**Windows:**
- Laden Sie Node.js von https://nodejs.org/ herunter
- Führen Sie das Installer aus

### 2. Dependencies installieren

```bash
cd linkedin-ads-dashboard
npm install
```

### 3. Dashboard starten

```bash
npm run dev
```

### 4. Dashboard öffnen

Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

**Login:** Passwort: `admin123`

## 🎯 Was Sie sehen werden

### Daily Tab
- KPI-Tabelle mit allen wichtigen Metriken
- Filter für Zeitraum und Kampagnen
- Sortierbare Spalten

### Weekly Tab
- TL;DR Box mit wichtigen Insights
- 3 Charts (Impressions/Clicks/Spend, CPL&CVR, CTR&CPM)
- Kampagnen Performance Tabelle
- Empfehlungen mit Akzeptieren/Ablehnen Buttons
- Export-Funktionen (PDF/CSV)

### Deep Dive Tab
- Creative-Leaderboard (beste/schlechteste CPL)
- Top/Bottom Performers
- Vollständige Performance-Tabelle
- Key Insights

### Logbuch Tab
- Event-Tracking Timeline
- Formular für neue Events (Budget/Bid/Creative/Notizen)
- Event-Summary Dashboard

## 🔧 Anpassungen

### Passwort ändern
Bearbeiten Sie `.env.local`:
```env
NEXT_PUBLIC_DASHBOARD_PASSWORD=ihr_neues_passwort
```

### Datenquelle verbinden
- Supabase Schema in `supabase/schema.sql` ausführen
- Credentials in `.env.local` setzen (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_INGEST_TOKEN`)
- n8n Workflow anlegen, der LinkedIn KPIs holt und an `/api/n8n-ingest` sendet

### Styling anpassen
- Tailwind CSS in `src/app/globals.css`
- Komponenten-spezifische Styles in den jeweiligen `.tsx` Dateien

## 🚨 Häufige Probleme

**Port bereits belegt:**
```bash
# Anderen Port verwenden
npm run dev -- -p 3001
```

**Dependencies-Fehler:**
```bash
# Cache leeren und neu installieren
rm -rf node_modules package-lock.json
npm install
```

**Build-Fehler:**
```bash
# TypeScript-Check
npm run lint
```

## 📱 Mobile Testing

Das Dashboard ist responsive. Testen Sie es auf verschiedenen Geräten:
- Desktop: 1920px+
- Tablet: 768px - 1919px  
- Mobile: 320px - 767px

## 🔮 Nächste Schritte

1. **Supabase Setup** (optional für MVP)
   - Supabase-Projekt erstellen
   - Database Schema ausführen (siehe README.md)
   - Credentials in `.env.local` eintragen

2. **Echte Daten Integration**
   - LinkedIn Ads API anbinden
   - Automatische Daten-Synchronisation

3. **Erweiterte Features**
   - Email Reports
   - Team Collaboration
   - Advanced Analytics

## 💡 Tipps

- Verwenden Sie die Browser-Entwicklertools für Debugging
- Alle Komponenten sind in `src/components/` modular aufgebaut
- Daten werden live aus Supabase geladen; passen Sie das n8n Payload-Format bei Bedarf an
- Das Design folgt Tailwind CSS Best Practices

Viel Erfolg mit Ihrem LinkedIn Ads Dashboard! 🎉


