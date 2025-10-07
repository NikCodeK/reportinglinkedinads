# 🔄 n8n Integration Guide

Komplette Anleitung zum Einrichten eines n8n Workflows, der täglich LinkedIn Ads Daten an Ihr Dashboard sendet.

---

## 📋 Übersicht

**Ziel:** Automatischer Datenimport aus LinkedIn Ads in das Dashboard via n8n

**Workflow:**
```
LinkedIn Ads API → n8n (Transformation) → Dashboard API → Supabase
```

**Zeitplan:** Einmal täglich (z.B. 6:00 Uhr morgens)

---

## 🔑 API Endpoint Details

### URL
```
Lokal:  http://localhost:3000/api/n8n-ingest
Vercel: https://[ihre-domain].vercel.app/api/n8n-ingest
```

### Methode
```
POST
```

### Headers
```
Authorization: Bearer 803708482ddbe1bae7482fbebf067b70d9376b46f7a2f08bc3acb3265f2bc0a2
Content-Type: application/json
```

### Payload Format

```json
{
  "dailyMetrics": [
    {
      "date": "2025-10-07",
      "campaignId": "campaign-123",
      "campaignName": "Brand Awareness Q4",
      "creativeId": "creative-456",
      "creativeName": "Summer Sale Banner",
      "impressions": 15000,
      "clicks": 450,
      "cost": 125.50,
      "leads": 25,
      "ctr": 3.0,
      "cpc": 0.28,
      "cpm": 8.37,
      "cvr": 5.56,
      "cpl": 5.02
    }
  ],
  "weeklyBriefing": {
    "weekStart": "2025-10-01",
    "weekEnd": "2025-10-07",
    "summary": "Diese Woche zeigt starkes Wachstum mit 15% mehr Leads bei gleichbleibenden Kosten.",
    "highlights": [
      "Beste CTR seit 3 Monaten",
      "CPL unter Zielwert",
      "Brand Campaign übertrifft Erwartungen"
    ],
    "insights": [
      "Mobile Traffic steigt um 20%",
      "Vormittags höchste Conversion Rate",
      "Video Ads performen 30% besser"
    ],
    "recommendations": [
      {
        "action": "Budget für Campaign XYZ um 20% erhöhen",
        "reasoning": "CPL liegt 40% unter Durchschnitt und Lead-Qualität ist sehr hoch",
        "impact": "high"
      },
      {
        "action": "Creative A pausieren",
        "reasoning": "CTR liegt bei nur 0.5%, deutlich unter Benchmark",
        "impact": "medium"
      }
    ],
    "status": "draft"
  }
}
```

---

## 🛠️ n8n Workflow Setup (Schritt-für-Schritt)

### 1️⃣ **Schedule Trigger Node**

**Node:** `Schedule Trigger`

**Konfiguration:**
- **Trigger Times:** Custom
- **Cron Expression:** `0 6 * * *` (täglich um 6:00 Uhr)
  - Oder nutzen Sie: "Every day at 6am"
- **Timezone:** Europe/Berlin

---

### 2️⃣ **LinkedIn Ads Data Holen**

**Node:** `HTTP Request` (für LinkedIn Ads API)

**Konfiguration:**
- **Method:** GET
- **URL:** LinkedIn Ads Analytics Endpoint
  ```
  https://api.linkedin.com/v2/adAnalytics
  ```
- **Authentication:** OAuth2
- **Query Parameters:**
  ```
  dateRange.start.day: {{ $today.minus({ days: 1 }).toFormat('yyyy-MM-dd') }}
  dateRange.end.day: {{ $today.toFormat('yyyy-MM-dd') }}
  pivot: CAMPAIGN
  fields: impressions,clicks,costInLocalCurrency,externalWebsiteConversions
  ```

**Alternative:** Wenn Sie CSV/Excel Export nutzen:
- **Node:** `Read Binary File` oder `HTTP Request` zum Download
- **Node:** `Spreadsheet File` zum Parsen

---

### 3️⃣ **Daten Transformieren (Function Node)**

**Node:** `Function` oder `Code`

**JavaScript Code:**

```javascript
// Eingabe: LinkedIn Ads Rohdaten
const linkedInData = $input.all();

// Transformation zu Dashboard Format
const dailyMetrics = linkedInData.map(item => {
  const impressions = item.json.impressions || 0;
  const clicks = item.json.clicks || 0;
  const cost = parseFloat(item.json.costInLocalCurrency || 0);
  const leads = item.json.externalWebsiteConversions || 0;

  // Berechne KPIs
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? cost / clicks : 0;
  const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
  const cvr = clicks > 0 ? (leads / clicks) * 100 : 0;
  const cpl = leads > 0 ? cost / leads : 0;

  return {
    date: item.json.dateRange?.start || new Date().toISOString().split('T')[0],
    campaignId: item.json.campaignId || item.json.campaign,
    campaignName: item.json.campaignName || null,
    creativeId: item.json.creativeId || null,
    creativeName: item.json.creativeName || null,
    impressions: impressions,
    clicks: clicks,
    cost: parseFloat(cost.toFixed(2)),
    leads: leads,
    ctr: parseFloat(ctr.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(4)),
    cpm: parseFloat(cpm.toFixed(4)),
    cvr: parseFloat(cvr.toFixed(2)),
    cpl: parseFloat(cpl.toFixed(4))
  };
});

// Optional: Weekly Briefing generieren (kann auch durch separaten Workflow/AI erfolgen)
const weeklyBriefing = {
  weekStart: $now.minus({ days: 6 }).toFormat('yyyy-MM-dd'),
  weekEnd: $now.toFormat('yyyy-MM-dd'),
  summary: `Automatischer Report für KW ${$now.weekNumber}`,
  highlights: [],
  insights: [],
  recommendations: [],
  status: 'draft'
};

// Ausgabe im richtigen Format
return {
  json: {
    dailyMetrics: dailyMetrics,
    weeklyBriefing: weeklyBriefing
  }
};
```

---

### 4️⃣ **An Dashboard API senden**

**Node:** `HTTP Request`

**Konfiguration:**
- **Method:** POST
- **URL:** 
  ```
  https://[ihre-vercel-domain].vercel.app/api/n8n-ingest
  ```
  oder für lokales Testing:
  ```
  http://localhost:3000/api/n8n-ingest
  ```
- **Authentication:** None (wir nutzen Header)
- **Send Headers:** Yes
  - **Header 1:**
    - Name: `Authorization`
    - Value: `Bearer 803708482ddbe1bae7482fbebf067b70d9376b46f7a2f08bc3acb3265f2bc0a2`
  - **Header 2:**
    - Name: `Content-Type`
    - Value: `application/json`
- **Send Body:** Yes
- **Body Content Type:** JSON
- **Specify Body:** Using JSON
- **JSON:** `{{ $json }}`

---

### 5️⃣ **Error Handling (Optional)**

**Node:** `IF`

**Bedingung:**
```
{{ $json.status === "ok" }}
```

**True Branch:** 
- **Node:** `Email` oder `Slack` → "✅ Daten erfolgreich importiert"

**False Branch:**
- **Node:** `Email` oder `Slack` → "❌ Fehler beim Import: {{ $json.error }}"

---

## 📊 Komplettes Workflow-Beispiel

```
┌─────────────────┐
│ Schedule        │
│ (täglich 6:00)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ HTTP Request    │
│ (LinkedIn API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Function        │
│ (Transform)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ HTTP Request    │
│ (Dashboard API) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ IF              │
│ (Check Success) │
└────┬──────┬─────┘
     │      │
  True│     │False
     │      │
     ▼      ▼
  [Slack] [Email]
```

---

## 🧪 Testing

### Test 1: API direkt testen

```bash
curl -X POST https://[ihre-domain].vercel.app/api/n8n-ingest \
  -H "Authorization: Bearer 803708482ddbe1bae7482fbebf067b70d9376b46f7a2f08bc3acb3265f2bc0a2" \
  -H "Content-Type: application/json" \
  -d '{
    "dailyMetrics": [
      {
        "date": "2025-10-07",
        "campaignId": "test-campaign-1",
        "campaignName": "Test Campaign",
        "impressions": 1000,
        "clicks": 50,
        "cost": 25.00,
        "leads": 5,
        "ctr": 5.0,
        "cpc": 0.50,
        "cpm": 25.00,
        "cvr": 10.0,
        "cpl": 5.00
      }
    ]
  }'
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "dailyMetrics": {
    "received": 1
  }
}
```

### Test 2: In n8n

1. Erstellen Sie einen einfachen Workflow:
   - `Manual Trigger` → `HTTP Request` (zum Dashboard)
2. Fügen Sie Testdaten ein
3. Klicken Sie "Execute Node"
4. Überprüfen Sie die Response

---

## 📝 Beispiel-Payloads

### Nur Daily Metrics
```json
{
  "dailyMetrics": [
    {
      "date": "2025-10-07",
      "campaignId": "camp-001",
      "campaignName": "Brand Awareness",
      "impressions": 5000,
      "clicks": 150,
      "cost": 45.00,
      "leads": 10,
      "ctr": 3.0,
      "cpc": 0.30,
      "cpm": 9.00,
      "cvr": 6.67,
      "cpl": 4.50
    }
  ]
}
```

### Nur Weekly Briefing
```json
{
  "weeklyBriefing": {
    "weekStart": "2025-10-01",
    "weekEnd": "2025-10-07",
    "summary": "Starke Performance diese Woche",
    "highlights": ["Beste CTR", "Niedrige Kosten"],
    "insights": ["Mobile Traffic hoch"],
    "recommendations": [
      {
        "action": "Budget erhöhen",
        "reasoning": "Gute Performance",
        "impact": "high"
      }
    ],
    "status": "draft"
  }
}
```

### Beides zusammen
```json
{
  "dailyMetrics": [...],
  "weeklyBriefing": {...}
}
```

---

## 🔒 Sicherheit

### API Token schützen

**In n8n:**
1. Gehen Sie zu Settings → Credentials
2. Erstellen Sie "Header Auth" Credential
3. Name: `Dashboard API Token`
4. Header Name: `Authorization`
5. Header Value: `Bearer 803708482ddbe1bae7482fbebf067b70d9376b46f7a2f08bc3acb3265f2bc0a2`
6. Nutzen Sie dieses Credential in HTTP Request Nodes

**Token rotieren:**
Wenn Sie den Token ändern möchten:
1. Generieren Sie neuen Token: `openssl rand -hex 32`
2. Aktualisieren Sie `.env.local` und Vercel
3. Aktualisieren Sie n8n Credential

---

## 🐛 Troubleshooting

### Problem: "Unauthorized" (401)
- ✅ Prüfen Sie Authorization Header
- ✅ Token muss mit "Bearer " beginnen
- ✅ Vergleichen Sie Token mit N8N_INGEST_TOKEN in Vercel

### Problem: "Invalid payload" (400)
- ✅ Prüfen Sie JSON Format
- ✅ Stellen Sie sicher, dass dailyMetrics ein Array ist
- ✅ Alle required Fields vorhanden (date, campaignId, impressions, etc.)

### Problem: "Failed to persist" (500)
- ✅ Überprüfen Sie Supabase Connection in Vercel
- ✅ Stellen Sie sicher, dass Tabellen existieren
- ✅ Prüfen Sie Vercel Logs für Details

### Problem: Daten erscheinen nicht im Dashboard
- ✅ Check API Response → muss "status": "ok" sein
- ✅ Öffnen Sie Dashboard und refresh (F5)
- ✅ Prüfen Sie Datum in Filtern

---

## 📚 Weiterführende Ressourcen

- [LinkedIn Ads API Dokumentation](https://docs.microsoft.com/en-us/linkedin/marketing/)
- [n8n HTTP Request Node Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) - für Live-Updates

---

## 💡 Best Practices

1. **Incremental Loading:** Nur Daten der letzten 24h abrufen
2. **Idempotenz:** Nutzen Sie die `upsert` Logik (wird automatisch gemacht)
3. **Error Notifications:** Richten Sie Alerts ein bei Fehlern
4. **Logging:** Aktivieren Sie n8n Executions History
5. **Backup:** Exportieren Sie Ihren Workflow regelmäßig

---

## 🎯 Nächste Schritte

1. ✅ n8n Workflow erstellen (siehe oben)
2. ✅ LinkedIn Ads API Access einrichten
3. ✅ Testdaten senden
4. ✅ Schedule aktivieren
5. ✅ Monitoring einrichten

