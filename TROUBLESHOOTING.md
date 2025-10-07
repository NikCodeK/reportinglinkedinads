# 🔧 Troubleshooting Guide

## Häufige Fehler und Lösungen

### ❌ Fehler: "Could not find the table 'public.fact_daily' in the schema cache"

**Problem:** Die Datenbanktabellen existieren noch nicht in Ihrer Supabase-Datenbank.

**Lösung:**

1. **Öffnen Sie Ihr Supabase-Projekt:**
   - Gehen Sie zu https://supabase.com/dashboard
   - Wählen Sie Ihr Projekt aus: `afdzzkvtynnrcagyunaa`

2. **Öffnen Sie den SQL Editor:**
   - Klicken Sie in der linken Sidebar auf "SQL Editor"
   - Oder navigieren Sie direkt zu: https://supabase.com/dashboard/project/afdzzkvtynnrcagyunaa/sql

3. **Führen Sie das Schema aus:**
   - Klicken Sie auf "New Query"
   - Öffnen Sie die Datei `supabase/schema.sql` in diesem Projekt
   - Kopieren Sie den gesamten Inhalt
   - Fügen Sie ihn in den SQL Editor ein
   - Klicken Sie auf "Run" (oder drücken Sie Cmd/Ctrl + Enter)

4. **Verifizieren Sie die Tabellen:**
   - Gehen Sie zu "Table Editor" in der linken Sidebar
   - Sie sollten jetzt diese Tabellen sehen:
     - `fact_daily`
     - `weekly_briefings`
     - `events`

5. **Testen Sie die Anwendung:**
   ```bash
   npm run dev
   ```
   - Öffnen Sie http://localhost:3000
   - Loggen Sie sich ein (Passwort: `admin123`)
   - Die Fehler sollten jetzt verschwunden sein

---

### ❌ Fehler: "Could not find the table 'public.weekly_briefings' in the schema cache"

**Problem:** Gleiche Ursache wie oben - das Schema wurde nicht ausgeführt.

**Lösung:** Folgen Sie den Schritten oben.

---

## Schnell-Checkliste für Setup

- [ ] Node.js 18+ installiert (`node -v`)
- [ ] Dependencies installiert (`npm install`)
- [ ] `.env.local` existiert mit echten Supabase-Credentials
- [ ] **Schema in Supabase ausgeführt** (siehe oben) ⚠️ **WICHTIG**
- [ ] Development Server läuft (`npm run dev`)
- [ ] Dashboard erreichbar unter http://localhost:3000

---

## Weitere häufige Probleme

### Port bereits belegt
```bash
# Anderen Port verwenden
npm run dev -- -p 3001
```

### Environment Variables werden nicht geladen
```bash
# Server neu starten nach .env.local Änderungen
# Strg+C drücken, dann:
npm run dev
```

### Supabase Connection Timeout
- Überprüfen Sie Ihre Internetverbindung
- Verifizieren Sie die Supabase-URL in `.env.local`
- Checken Sie ob Ihr Supabase-Projekt aktiv ist

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Stellen Sie sicher, dass `.env.local` die Variable `SUPABASE_SERVICE_ROLE_KEY` enthält
- Server neu starten nach Änderungen

---

## Debug-Modus

Um mehr Details über Fehler zu sehen:

1. Öffnen Sie die Browser-Entwicklertools (F12)
2. Schauen Sie in den Console-Tab
3. Schauen Sie in den Network-Tab für API-Requests

---

## Support

Wenn das Problem weiterhin besteht:

1. Überprüfen Sie die Supabase-Projekt-Status: https://status.supabase.com
2. Checken Sie die Supabase Logs im Dashboard
3. Stellen Sie sicher, dass Sie die neueste Version haben (`git pull`)

