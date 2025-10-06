# MVP Plan: LinkedIn Ads Dashboard

## Überblick
- Ziel: Automatisiertes Wochenbriefing auf Basis von LinkedIn-KPIs, erzeugt von n8n und präsentiert im Dashboard.
- Architektur: n8n als Orchestrator, Supabase als Datenspeicher, Next.js als Oberfläche, Webhook als Übergabe.

## Kernkomponenten & Verantwortlichkeiten
- n8n
  - Holt LinkedIn Ads KPIs (daily/weekly) direkt von der Quelle.
  - Transformiert Rohdaten in saubere Payloads und erzeugt wöchentliche Briefings (Summary, Insights, Empfehlungen).
  - Pusht Daten und Briefings an das Dashboard (via REST/Webhook).
- Supabase (Postgres + Auth)
  - Speichert Daily- und Weekly-KPI-Datensätze (`fact_daily`, `fact_weekly`).
  - Hält Briefing-Records (`weekly_briefings` mit Payload, Status, Timestamp).
  - Stellt DB-Zugriff fürs Dashboard bereit; optional Edge Functions für serverseitige Operationen.
- Next.js Dashboard
  - Visualisiert Daily-Tabellen, Weekly-Briefing-Anzeige, Status der letzten Aktualisierung.
  - Erlaubt Review/Publish des Briefings; kann Logbuch-Einträge anzeigen.
  - Nutzt Supabase Client für Datenfetching.
- Webhook/REST Endpoint
  - Authentifizierter Eingang für n8n (Basic Auth / API Key).
  - Validiert Payload, schreibt Daten in Supabase, quittiert Status.

## Geplanter Datenfluss
1. n8n zieht LinkedIn-KPIs (z.B. täglich via API/CSV) und harmonisiert Felder.
2. n8n sendet Daily-Datensätze an Webhook → Endpoint speichert in `fact_daily`.
3. n8n aggregiert wöchentlich und erzeugt Briefing-Payload → sendet an Endpoint → Speichert in `weekly_briefings`.
4. Dashboard liest Supabase-Daten, zeigt KPIs & Briefings, ermöglicht Veröffentlichung.
5. Bei Publish kann n8n optional getriggert werden (z.B. Supabase Trigger) für Distribution (Slack, Email, Docs).

## Implementierungsphasen
1. **Data Ingestion Setup**
   - n8n-Workflow für LinkedIn-API/Export anlegen.
   - Request/Response-Format des Webhooks definieren.
2. **Persistenz & Endpoint**
   - Supabase-Schema anlegen (`fact_daily`, `fact_weekly`, `weekly_briefings`).
   - Next.js API-Route oder Supabase Edge Function implementieren (Auth, Validierung, Upsert).
3. **Dashboard-Anpassungen**
   - Daily-Tab und Weekly-Tab auf Supabase-Daten umstellen.
   - Briefing-Modul integrieren (Summary, KPIs, Empfehlungen, Publish-Button).
4. **Briefing-Workflow**
   - n8n-Logik für wöchentliche Aggregation & Textbausteine bauen.
   - Publish-Trigger und optionaler Feedback-Loop (Logbuch-Eintrag) implementieren.
5. **Tests & Monitoring**
   - Sample-Daten durch n8n → Supabase → Dashboard laufen lassen.
   - Fehler-Logging (Supabase Logs/Sentry) und Update-Status im UI anzeigen.

## Offene Punkte / Annahmen
- LinkedIn API-Zugriff ist in n8n bereits konfigurierbar.
- Authentifizierung zwischen n8n und Endpoint erfolgt über Secret Key.
- Dashboard benötigt minimalen manuellen Input (Review/Publish), Rest automatisiert.
- Distribution (Slack/Email/Notion) läuft über n8n; Rückmeldungen werden optional in Supabase gespeichert.

## Supabase-Datenmodell (aktuell)
- `fact_daily`
  - KPI-Grundlage pro Datum/Campaign/Creative (inkl. `campaign_name`, `creative_name`)
  - Kennzahlen: `impressions`, `clicks`, `cost`, `leads`, `ctr`, `cpc`, `cpm`, `cvr`, `cpl`
  - `created_at`, `updated_at` für Health Monitoring
- `weekly_briefings`
  - Wöchentlicher Report inkl. `summary`, `insights`, `highlights`, `kpi_comparisons`, `recommendations`
  - Statusverwaltung (`draft`/`published`) + `published_at`
- `events`
  - Logbuch-Einträge (Budget/Bid/Creative/Notiz etc.)
  - Optionaler numerischer `value` für Budget/Bid-Änderungen

## Webhook / API Contract
- Endpoint: `POST /api/n8n-ingest`
- Auth: Header `Authorization: Bearer <N8N_INGEST_TOKEN>`
- Payload Felder:
  - `dailyMetrics`: Array mit Raws (`date`, `campaignId`, `campaignName`, `creativeId`, `creativeName`, KPIs)
  - `weeklyBriefing`: Objekt mit `weekStart`, `weekEnd`, `summary`, optional `highlights`, `insights`, `recommendations`
- Response: `{ status: "ok", dailyMetrics: { received }, weeklyBriefing }`
- Fehlerfälle liefern HTTP 4xx/5xx mit Message + Details

## Dashboard MVP Umfang
- **Daily Tab**: Supabase-basierte Tabelle mit Datums-/Kampagnenfilter, Pagination, Status "Letztes Update"
- **Weekly Tab**: TL;DR, KPI-Charts (Impressions/Clicks/Spend, CPL/CVR, CTR/CPM), Kampagnenperformance, Recommendations + Publish-Button
- **Deep Dive Tab**: Creative-Leaderboard (Top-/Bottom-CPL) inklusive Filtersteuerung
- **Logbuch Tab**: Event-Liste aus Supabase sowie Formular für neue Einträge

## n8n Workflow-Bausteine
- Trigger: `Cron` (Daily + Weekly)
- Datenquellen: LinkedIn Ads API/Export Nodes
- Mapping: Normalisierung der Felder, Kampagnen-/Creative-Namen anreichern
- Persistenz: HTTP Request Node → `/api/n8n-ingest` (JSON Body mit `dailyMetrics` / `weeklyBriefing`, Retries + Error Handling)
- Distribution (optional): Nach erfolgreichem Publish Slack/E-Mail/Docs Updates anstoßen

## Zeitplan & Meilensteine (laufend)
- **Ingestion ready**: Supabase Schema deployed, Endpoint live, n8n sendet Produktivdaten
- **UI-Abnahme**: Alle Tabs lesen Supabase, Publish-Status funktioniert, Fehler-/Empty States angezeigt
- **Automation Launch**: n8n Weekly-Flow generiert Briefing und stößt Distribution nach Publish an

## Risiken & Gegenmaßnahmen
- LinkedIn API Limits → Caching/Retry in n8n, Export-Zeitpläne prüfen
- Datenqualität (fehlende KPIs) → Validierung im Endpoint + Fallbacks im UI
- Auth-Fehler oder Secret-Leaks → Rotierende `x-api-key`, Secrets in n8n vault
- UI-Performance bei großen Tabellen → Pagination, Lazy Queries
- Change Management → MVP fokussiert auf Single-Account, Multi-Account erst später
