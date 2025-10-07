# ✅ Setup Checklist

Folgen Sie dieser Checkliste Schritt für Schritt, um das Dashboard einzurichten.

## 📋 Pre-Installation

- [ ] **Node.js 18+** installiert
  ```bash
  node -v
  # Sollte v18.0.0 oder höher sein
  ```

- [ ] **Git** installiert
  ```bash
  git --version
  ```

---

## 📦 Installation

### 1. Repository klonen (falls noch nicht geschehen)
```bash
git clone https://github.com/NikCodeK/reportinglinkedinads.git
cd reportinglinkedinads
```

### 2. Dependencies installieren
```bash
npm install
```

**Erwartetes Ergebnis:** 
- `node_modules/` Ordner wird erstellt
- Keine Fehler in der Konsole

---

## 🗄️ Supabase Setup

### 3. Supabase-Projekt erstellen (falls noch nicht geschehen)

- [ ] Gehen Sie zu https://supabase.com
- [ ] Erstellen Sie ein neues Projekt
- [ ] Notieren Sie sich:
  - Project URL
  - Anon Key
  - Service Role Key

### 4. Environment-Datei konfigurieren

Die `.env.local` Datei sollte bereits existieren. Überprüfen Sie:

```bash
cat .env.local
```

Stellen Sie sicher, dass diese Werte gesetzt sind:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `N8N_INGEST_TOKEN`

### 5. 🔥 **KRITISCH: Datenbank-Schema ausführen**

**Dies ist der wichtigste Schritt!** Ohne diesen Schritt funktioniert das Dashboard nicht.

1. **Öffnen Sie Ihr Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/[IHR-PROJECT-REF]/sql
   ```

2. **Erstellen Sie eine neue Query:**
   - Klicken Sie auf "SQL Editor" in der Sidebar
   - Klicken Sie auf "New Query"

3. **Kopieren Sie das Schema:**
   - Öffnen Sie `supabase/schema.sql` in diesem Projekt
   - Kopieren Sie den gesamten Inhalt (alle 67 Zeilen)

4. **Führen Sie das Schema aus:**
   - Fügen Sie den kopierten Inhalt in den SQL Editor ein
   - Klicken Sie auf "RUN" (oder drücken Sie Cmd+Enter)
   - Warten Sie auf "Success" Nachricht

5. **Verifizieren Sie die Tabellen:**
   - Gehen Sie zu "Table Editor"
   - Sie sollten sehen:
     - [ ] `fact_daily` Tabelle
     - [ ] `weekly_briefings` Tabelle
     - [ ] `events` Tabelle

**Wenn Sie die Tabellen sehen:** ✅ Perfekt, weiter zum nächsten Schritt!

**Wenn Sie Fehler sehen:** Überprüfen Sie die Fehlermeldung im SQL Editor.

---

## 🚀 Anwendung starten

### 6. Development Server starten

```bash
npm run dev
```

**Erwartetes Ergebnis:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### 7. Dashboard öffnen

- [ ] Öffnen Sie http://localhost:3000
- [ ] Sie sollten die Login-Seite sehen

### 8. Login testen

- [ ] Geben Sie das Passwort ein: `admin123`
- [ ] Klicken Sie auf "Login"
- [ ] Sie sollten das Dashboard sehen

### 9. Tabs überprüfen

- [ ] **Daily Tab:** Sollte laden (evtl. leer, aber KEINE Fehlermeldung)
- [ ] **Weekly Tab:** Sollte laden (evtl. leer, aber KEINE Fehlermeldung)
- [ ] **Deep Dive Tab:** Sollte laden
- [ ] **Logbuch Tab:** Sollte laden

**Wenn Sie diese Fehlermeldungen sehen:**
```
❌ "Could not find the table 'public.fact_daily' in the schema cache"
❌ "Could not find the table 'public.weekly_briefings' in the schema cache"
```

**→ Gehen Sie zurück zu Schritt 5 und führen Sie das Schema aus!**

---

## ✅ Erfolg!

Wenn alle Schritte abgeschlossen sind:
- ✅ Das Dashboard lädt ohne Fehler
- ✅ Alle Tabs sind zugänglich
- ✅ Keine "table not found" Fehler in der Konsole

---

## 🎯 Nächste Schritte

### Testdaten hinzufügen (optional)

Sie können Testdaten manuell in Supabase einfügen:

1. Gehen Sie zu Table Editor > `fact_daily`
2. Klicken Sie auf "Insert row"
3. Fügen Sie Beispieldaten ein:
   - date: 2025-10-01
   - campaign_id: test-campaign-1
   - campaign_name: Test Campaign
   - impressions: 1000
   - clicks: 50
   - cost: 25.50
   - leads: 5
   - ctr: 5.0
   - cpc: 0.51
   - cpm: 25.50
   - cvr: 10.0
   - cpl: 5.10

### n8n Integration einrichten

Folgen Sie der Dokumentation in `README.md` Abschnitt "Datenfluss & n8n".

---

## 🆘 Probleme?

Schauen Sie in `TROUBLESHOOTING.md` für Lösungen zu häufigen Problemen.

