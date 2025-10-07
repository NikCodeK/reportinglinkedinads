# 🚀 n8n Quick Start - 5 Minuten Setup

Schnellanleitung zum Einrichten des n8n Workflows für LinkedIn Ads Datenimport.

---

## ⚡ Schnellstart in 5 Schritten

### 1️⃣ Workflow in n8n importieren

1. Öffnen Sie n8n: https://[ihre-n8n-instanz].app
2. Klicken Sie auf **"+ New"** → **"Import from File"**
3. Wählen Sie die Datei: `n8n-workflow-template.json`
4. Klicken Sie **"Import"**

✅ **Workflow ist jetzt geladen!**

---

### 2️⃣ API Credential erstellen

1. In n8n: Gehen Sie zu **Settings** → **Credentials**
2. Klicken Sie **"Add Credential"**
3. Wählen Sie **"Header Auth"**
4. Konfiguration:
   ```
   Name: Dashboard API Token
   Header Name: Authorization
   Header Value: Bearer 803708482ddbe1bae7482fbebf067b70d9376b46f7a2f08bc3acb3265f2bc0a2
   ```
5. Klicken Sie **"Save"**

✅ **API Token ist gespeichert!**

---

### 3️⃣ Dashboard URL anpassen

1. Öffnen Sie den importierten Workflow
2. Klicken Sie auf den Node **"Send to Dashboard API"**
3. Ändern Sie die URL:
   ```
   Von: https://IHRE-VERCEL-DOMAIN.vercel.app/api/n8n-ingest
   Zu:  https://[ihre-echte-domain].vercel.app/api/n8n-ingest
   ```
4. Stellen Sie sicher, dass **Authentication** auf `Dashboard API Token` gesetzt ist

✅ **URL ist konfiguriert!**

---

### 4️⃣ Testlauf durchführen

1. Klicken Sie auf **"Execute Workflow"** (oben rechts)
2. Der Workflow wird einmal durchlaufen
3. Überprüfen Sie die Ausgabe:
   - ✅ Grüne Häkchen = Erfolg
   - ❌ Rote Kreuze = Fehler (siehe Details im Node)

4. Gehen Sie zu Ihrem Dashboard: https://[ihre-domain].vercel.app
5. Öffnen Sie den **Daily Tab**
6. Sie sollten die Test-Daten sehen!

✅ **Test erfolgreich!**

---

### 5️⃣ Schedule aktivieren

1. Im Workflow: Klicken Sie auf **"Active"** Toggle (oben rechts)
2. Der Workflow läuft jetzt **täglich um 6:00 Uhr**

✅ **Automatisierung ist aktiv!**

---

## 🔧 Anpassungen

### LinkedIn Ads Daten einbinden

**Aktuell:** Der Workflow nutzt Beispiel-Daten im "Transform Data" Node.

**Um echte Daten zu nutzen:**

1. Fügen Sie **vor** dem "Transform Data" Node einen neuen Node hinzu:
   - **HTTP Request** für LinkedIn Ads API
   - **Oder:** CSV/Excel File lesen

2. Passen Sie den "Transform Data" Code an:
   ```javascript
   // Statt Beispiel-Daten:
   const linkedInData = $input.first().json;
   
   // Transformieren Sie die echten LinkedIn Daten...
   ```

Siehe `N8N_INTEGRATION_GUIDE.md` für Details!

---

### Schedule ändern

**Aktuell:** Täglich um 6:00 Uhr

**Ändern:**
1. Klicken Sie auf **"Schedule: Daily at 6am"** Node
2. Ändern Sie die **Cron Expression**:
   - `0 8 * * *` = 8:00 Uhr
   - `0 */6 * * *` = Alle 6 Stunden
   - `0 6 * * 1` = Jeden Montag um 6:00 Uhr

---

### Notifications hinzufügen

**Erfolg benachrichtigen:**
1. Ersetzen Sie "Success Notification" Node durch:
   - **Slack** Node
   - **Email** Node
   - **Discord** Node

**Fehler benachrichtigen:**
1. Ersetzen Sie "Error Notification" Node durch:
   - **Slack** Node (empfohlen für sofortige Alerts)
   - **Email** Node

---

## 📊 Dashboard überprüfen

Nach dem ersten erfolgreichen Run:

1. **Dashboard öffnen:** https://[ihre-domain].vercel.app
2. **Login:** Passwort `admin123`
3. **Daily Tab:** Sollte neue Zeilen zeigen
4. **Weekly Tab:** Sollte Briefing zeigen (falls aktiviert)

---

## 🐛 Probleme?

### Fehler: "Unauthorized" (401)
- ❌ API Token falsch
- ✅ Überprüfen Sie Credential in n8n
- ✅ Vergleichen Sie mit `N8N_INGEST_TOKEN` in `.env.local`

### Fehler: "Invalid payload" (400)
- ❌ JSON Format falsch
- ✅ Prüfen Sie "Transform Data" Node Output
- ✅ Alle required Fields müssen vorhanden sein

### Daten erscheinen nicht
- ❌ Vercel Environment Variables fehlen
- ✅ Siehe `TROUBLESHOOTING.md`

### Workflow startet nicht automatisch
- ❌ Workflow ist nicht "Active"
- ✅ Klicken Sie auf "Active" Toggle (oben rechts)
- ✅ Überprüfen Sie Schedule Node Konfiguration

---

## 📚 Weitere Dokumentation

- **Vollständige Anleitung:** `N8N_INTEGRATION_GUIDE.md`
- **API Details:** Siehe `/api/n8n-ingest/route.ts`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

## ✅ Checklist

Nach dem Setup sollten Sie:

- [x] Workflow importiert
- [x] API Credential erstellt
- [x] Dashboard URL angepasst
- [x] Testlauf erfolgreich
- [x] Daten im Dashboard sichtbar
- [x] Schedule aktiviert
- [x] Notifications eingerichtet (optional)

---

## 💡 Pro-Tipps

1. **Testen Sie zuerst manuell** (Execute Workflow) bevor Sie Schedule aktivieren
2. **Überwachen Sie die ersten Tage** die Executions History in n8n
3. **Richten Sie Error Alerts ein** um sofort informiert zu werden
4. **Exportieren Sie Ihren Workflow** regelmäßig als Backup
5. **Dokumentieren Sie Ihre Anpassungen** für zukünftige Referenz

---

Viel Erfolg! 🎉

