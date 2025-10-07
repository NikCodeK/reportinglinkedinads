export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  campaignType?: string;
  status?: string;
  budget?: {
    min: number;
    max: number;
  };
  campaignIds?: string[];
}

export interface DailyKPI {
  id: string;
  date: string;
  campaignId: string;
  campaignName?: string | null;
  creativeId?: string | null;
  creativeName?: string | null;
  updatedAt?: string | null;

  // Core Metrics
  impressions: number;
  clicks: number;
  reach?: number;
  frequency?: number;

  // Performance Rates
  ctr: number;                    // Click-Through-Rate
  cvr: number;                    // Conversion Rate
  cvrLeadGen?: number;            // Conversion Rate Lead Gen Form
  engagementRate?: number;        // Engagement Rate
  watchRate?: number;             // Watch Rate (nur Video Ads)
  viewThroughRate?: number;       // Rate vollständiger Ansichten
  landingPageClickRate?: number;  // Rate der Landing Page Klicks

  // Cost Metrics
  cost: number;                   // Ausgaben
  cpc: number;                    // Cost per Click
  cpm: number;                    // Cost per Mille (1.000 Impressions)
  cpl: number;                    // Cost per Lead
  costPerConversion?: number;     // Cost per Conversion
  costPerResult?: number;         // Kosten pro Ergebnis

  // Results
  leads: number;                  // Leads
  conversions?: number;           // Conversions
  landingPageClicks?: number;     // Klicks auf Zielseite
  completedLeadForms?: number;    // Ausgefüllte Lead-Formulare

  // Quality & Targeting
  leadQuality?: number;           // Lead-Qualität (0-100)
  targetAudienceReach?: number;   // Prozentsatz der erreichten Zielgruppe
  targetAudienceSize?: number;    // Zielgruppengröße
  adFrequency?: number;           // Ad Frequency

  // Budget & Bidding
  dailyBudget?: number;           // Tagesbudget
  averageDailySpend?: number;     // Durchschnittliche Tagesausgaben
  bid?: number;                   // Gebot
}

export interface WeeklyData {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  leads: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpl: number;
  cvr: number;
}

export interface LogEvent {
  id: string;
  timestamp?: string;
  type: 'campaign_created' | 'campaign_paused' | 'budget_updated' | 'creative_rotation' | 'bid_adjustment' | 'budget_change' | 'bid_change' | 'note';
  description: string;
  campaignId?: string;
  campaignName?: string;
  value?: number;
  createdAt?: string;
  createdBy?: string;
  details?: Record<string, any>;
}

export interface CreativePerformanceStats {
  creativeId: string;
  creativeName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  impressions: number;
  clicks: number;
  cost: number;
  leads: number;
  ctr: number;
  cpc: number;
  cvr: number;
  cpl: number;
  count: number;
}

export interface WeeklyBriefingRecommendation {
  id?: string;
  action: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  status?: 'pending' | 'approved' | 'rejected';
}

export interface WeeklyBriefing {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  highlights: string[];
  insights: string[];
  kpiComparisons: Record<string, unknown>;
  recommendations: WeeklyBriefingRecommendation[];
  status: 'draft' | 'published';
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
