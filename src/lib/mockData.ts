import { Campaign, Creative, DailyKPI, WeeklySnapshot, Recommendation, LogEvent } from '@/types';

export const mockCampaigns: Campaign[] = [
  {
    id: 'campaign-1',
    name: 'B2B Lead Generation Q4',
    type: 'Sponsored Content',
    status: 'active',
    objective: 'Lead Generation',
    budget: 5000,
    dailyBudget: 200,
    spent: 3200,
    averageDailySpend: 180,
    impressions: 125000,
    clicks: 2500,
    reach: 45000,
    frequency: 2.8,
    ctr: 2.0,
    cvr: 3.5,
    engagementRate: 4.2,
    cpc: 1.28,
    cpm: 25.6,
    cpl: 36.5,
    costPerConversion: 28.5,
    conversions: 88,
    leads: 88,
    landingPageClicks: 2200,
    leadQuality: 85,
    targetAudienceReach: 78,
    targetAudienceSize: 58000,
    adFrequency: 2.8,
    bid: 1.5,
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  },
  {
    id: 'campaign-2',
    name: 'Brand Awareness Campaign',
    type: 'Sponsored Content',
    status: 'active',
    objective: 'Brand Awareness',
    budget: 3000,
    dailyBudget: 150,
    spent: 1800,
    averageDailySpend: 120,
    impressions: 95000,
    clicks: 1200,
    reach: 35000,
    frequency: 2.7,
    ctr: 1.26,
    cvr: 2.1,
    engagementRate: 3.8,
    cpc: 1.5,
    cpm: 18.9,
    cpl: 71.4,
    costPerConversion: 45.0,
    conversions: 25,
    leads: 25,
    landingPageClicks: 1000,
    leadQuality: 72,
    targetAudienceReach: 60,
    targetAudienceSize: 42000,
    adFrequency: 2.7,
    bid: 1.2,
    startDate: '2024-01-15',
    endDate: '2024-02-28'
  },
  {
    id: 'campaign-3',
    name: 'Product Launch Campaign',
    type: 'Sponsored Content',
    status: 'paused',
    objective: 'Website Traffic',
    budget: 8000,
    dailyBudget: 400,
    spent: 2400,
    averageDailySpend: 300,
    impressions: 180000,
    clicks: 3600,
    reach: 65000,
    frequency: 2.8,
    ctr: 2.0,
    cvr: 4.2,
    engagementRate: 5.1,
    cpc: 0.67,
    cpm: 13.3,
    cpl: 15.9,
    costPerConversion: 12.5,
    conversions: 151,
    leads: 151,
    landingPageClicks: 3200,
    leadQuality: 92,
    targetAudienceReach: 85,
    targetAudienceSize: 76000,
    adFrequency: 2.8,
    bid: 0.8,
    startDate: '2024-01-01',
    endDate: '2024-04-30'
  },
  {
    id: 'campaign-4',
    name: 'Retargeting Campaign',
    type: 'Sponsored Content',
    status: 'active',
    objective: 'Conversions',
    budget: 2000,
    dailyBudget: 100,
    spent: 1200,
    averageDailySpend: 80,
    impressions: 45000,
    clicks: 1800,
    reach: 18000,
    frequency: 2.5,
    ctr: 4.0,
    cvr: 6.7,
    engagementRate: 7.2,
    cpc: 0.67,
    cpm: 26.7,
    cpl: 10.0,
    costPerConversion: 8.0,
    conversions: 120,
    leads: 120,
    landingPageClicks: 1600,
    leadQuality: 95,
    targetAudienceReach: 90,
    targetAudienceSize: 20000,
    adFrequency: 2.5,
    bid: 0.7,
    startDate: '2024-01-10',
    endDate: '2024-02-29'
  }
];

export const mockCreatives: Creative[] = [
  {
    id: 'creative-1',
    campaignId: 'campaign-1',
    name: 'Tech Innovation Headline',
    type: 'image',
    headline: 'Revolutionäre Technologie für Ihr Unternehmen',
    description: 'Entdecken Sie unsere neueste Lösung für mehr Effizienz',
    cta: 'Jetzt testen'
  },
  {
    id: 'creative-2',
    campaignId: 'campaign-1',
    name: 'Data Analytics Video',
    type: 'video',
    headline: 'Datenanalyse leicht gemacht',
    description: 'Schauen Sie sich unser 30-Sekunden Video an',
    cta: 'Video ansehen'
  },
  {
    id: 'creative-3',
    campaignId: 'campaign-2',
    name: 'Brand Story Carousel',
    type: 'carousel',
    headline: 'Unsere Erfolgsgeschichte',
    description: 'Von Startup zu Marktführer in 5 Jahren',
    cta: 'Mehr erfahren'
  },
  {
    id: 'creative-4',
    campaignId: 'campaign-3',
    name: 'Product Demo Image',
    type: 'image',
    headline: 'Neues Produkt verfügbar',
    description: 'Erste Einblicke in unsere Innovation',
    cta: 'Jetzt entdecken'
  }
];

export const mockDailyKPIs: DailyKPI[] = [
  {
    id: 'kpi-1',
    date: '2024-01-15',
    campaignId: 'campaign-1',
    creativeId: 'creative-1',
    impressions: 15420,
    clicks: 324,
    cost: 486.50,
    leads: 18,
    ctr: 2.1,
    cpc: 1.50,
    cpm: 31.55,
    cvr: 5.56,
    cpl: 27.03
  },
  {
    id: 'kpi-2',
    date: '2024-01-15',
    campaignId: 'campaign-1',
    creativeId: 'creative-2',
    impressions: 12850,
    clicks: 289,
    cost: 433.50,
    leads: 22,
    ctr: 2.25,
    cpc: 1.50,
    cpm: 33.74,
    cvr: 7.61,
    cpl: 19.70
  },
  {
    id: 'kpi-3',
    date: '2024-01-16',
    campaignId: 'campaign-1',
    creativeId: 'creative-1',
    impressions: 16230,
    clicks: 356,
    cost: 534.00,
    leads: 20,
    ctr: 2.19,
    cpc: 1.50,
    cpm: 32.89,
    cvr: 5.62,
    cpl: 26.70
  },
  {
    id: 'kpi-4',
    date: '2024-01-16',
    campaignId: 'campaign-2',
    creativeId: 'creative-3',
    impressions: 9850,
    clicks: 197,
    cost: 295.50,
    leads: 12,
    ctr: 2.0,
    cpc: 1.50,
    cpm: 30.0,
    cvr: 6.09,
    cpl: 24.63
  },
  {
    id: 'kpi-5',
    date: '2024-01-17',
    campaignId: 'campaign-1',
    creativeId: 'creative-2',
    impressions: 14560,
    clicks: 312,
    cost: 468.00,
    leads: 25,
    ctr: 2.14,
    cpc: 1.50,
    cpm: 32.14,
    cvr: 8.01,
    cpl: 18.72
  },
  {
    id: 'kpi-6',
    date: '2024-01-17',
    campaignId: 'campaign-4',
    creativeId: 'creative-4',
    impressions: 7560,
    clicks: 189,
    cost: 283.50,
    leads: 15,
    ctr: 2.5,
    cpc: 1.50,
    cpm: 37.5,
    cvr: 7.94,
    cpl: 18.90
  }
];

export const mockWeeklySnapshots: WeeklySnapshot[] = [
  {
    id: 'snapshot-1',
    weekStart: '2024-01-15',
    weekEnd: '2024-01-21',
    insights: [
      'Video Creative (creative-2) zeigt 30% bessere CVR als Image Creative',
      'Retargeting Campaign (campaign-4) erreicht höchste CTR mit 2.5%',
      'Gesamtkosten pro Lead (CPL) um 15% gesunken im Vergleich zur Vorwoche',
      'B2B Lead Generation Campaign (campaign-1) generiert 85% aller Leads'
    ],
    recommendations: [
      {
        id: 'rec-1',
        type: 'creative',
        action: 'Video Creative Budget erhöhen',
        reasoning: 'Video Creative zeigt deutlich bessere Conversion Rate',
        impact: 'high',
        status: 'pending'
      },
      {
        id: 'rec-2',
        type: 'budget',
        action: 'B2B Lead Generation Budget um 20% erhöhen',
        reasoning: 'Höchste Lead-Qualität und gute Performance',
        impact: 'medium',
        status: 'pending'
      }
    ],
    published: false,
    createdAt: '2024-01-22T10:00:00Z'
  }
];

export const mockEvents: LogEvent[] = [
  {
    id: 'event-1',
    type: 'budget_change',
    campaignId: 'campaign-1',
    description: 'Budget von €4,000 auf €5,000 erhöht',
    value: 1000,
    createdAt: '2024-01-15T09:30:00Z',
    createdBy: 'Dima'
  },
  {
    id: 'event-2',
    type: 'creative_rotation',
    campaignId: 'campaign-2',
    description: 'Neue Creative-Variante hinzugefügt',
    createdAt: '2024-01-16T14:15:00Z',
    createdBy: 'Dima'
  },
  {
    id: 'event-3',
    type: 'note',
    description: 'Wöchentliches Team-Meeting: Fokus auf Lead-Qualität',
    createdAt: '2024-01-17T16:00:00Z',
    createdBy: 'Dima'
  },
  {
    id: 'event-4',
    type: 'bid_change',
    campaignId: 'campaign-4',
    description: 'Bid von €1.20 auf €1.50 erhöht',
    value: 0.30,
    createdAt: '2024-01-18T11:45:00Z',
    createdBy: 'Dima'
  }
];


