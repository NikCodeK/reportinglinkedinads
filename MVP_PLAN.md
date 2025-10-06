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
