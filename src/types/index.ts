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
  creativeId: string;
  
  // Core Metrics
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  
  // Performance Rates
  ctr: number;                    // Click-Through-Rate
  cvr: number;                    // Conversion Rate
  cvrLeadGen: number;             // Conversion Rate Lead Gen Form
  engagementRate: number;         // Engagement Rate
  watchRate?: number;             // Watch Rate (nur Video Ads)
  viewThroughRate: number;        // Rate vollständiger Ansichten
  landingPageClickRate: number;   // Rate der Landing Page Klicks
  
  // Cost Metrics
  cost: number;                   // Ausgaben
  cpc: number;                    // Cost per Click
  cpm: number;                    // Cost per Mille (1.000 Impressions)
  cpl: number;                    // Cost per Lead
  costPerConversion: number;      // Cost per Conversion
  costPerResult: number;          // Kosten pro Ergebnis
  
  // Results
  leads: number;                  // Leads
  conversions: number;            // Conversions
  landingPageClicks: number;      // Klicks auf Zielseite
  completedLeadForms: number;     // Ausgefüllte Lead-Formulare
  
  // Quality & Targeting
  leadQuality: number;            // Lead-Qualität (0-100)
  targetAudienceReach: number;    // Prozentsatz der erreichten Zielgruppe
  targetAudienceSize: number;     // Zielgruppengröße
  adFrequency: number;            // Ad Frequency
  
  // Budget & Bidding
  dailyBudget: number;            // Tagesbudget
  averageDailySpend: number;      // Durchschnittliche Tagesausgaben
  bid: number;                    // Gebot
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  
  // Budget & Spending
  budget: number;                 // Gesamtbudget
  dailyBudget: number;            // Tagesbudget
  spent: number;                  // Ausgaben
  averageDailySpend: number;      // Durchschnittliche Tagesausgaben
  
  // Performance Metrics
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  
  // Rates
  ctr: number;                    // Click-Through-Rate
  cvr: number;                    // Conversion Rate
  engagementRate: number;         // Engagement Rate
  
  // Cost Metrics
  cpc: number;                    // Cost per Click
  cpm: number;                    // Cost per Mille
  cpl: number;                    // Cost per Lead
  costPerConversion: number;      // Cost per Conversion
  
  // Results
  conversions: number;
  leads: number;
  landingPageClicks: number;      // Klicks auf Zielseite
  
  // Quality & Targeting
  leadQuality: number;            // Lead-Qualität (0-100)
  targetAudienceReach: number;    // Prozentsatz der erreichten Zielgruppe
  targetAudienceSize: number;     // Zielgruppengröße
  adFrequency: number;            // Ad Frequency
  
  // Bidding
  bid: number;                    // Gebot
  
  // Dates
  startDate: string;
  endDate: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  type: 'image' | 'video' | 'carousel' | 'text' | 'document';
  status: string;
  
  // Core Metrics
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  
  // Performance Rates
  ctr: number;                    // Click-Through-Rate
  cvr: number;                    // Conversion Rate
  engagementRate: number;         // Engagement Rate
  watchRate?: number;             // Watch Rate (nur Video Ads)
  viewThroughRate: number;        // Rate vollständiger Ansichten
  landingPageClickRate: number;   // Rate der Landing Page Klicks
  
  // Cost Metrics
  cpc: number;                    // Cost per Click
  cpm: number;                    // Cost per Mille
  cpl: number;                    // Cost per Lead
  costPerConversion: number;      // Cost per Conversion
  
  // Results
  conversions: number;
  leads: number;
  landingPageClicks: number;      // Klicks auf Zielseite
  completedLeadForms: number;     // Ausgefüllte Lead-Formulare
  
  // Quality & Targeting
  leadQuality: number;            // Lead-Qualität (0-100)
  targetAudienceReach: number;    // Prozentsatz der erreichten Zielgruppe
  adFrequency: number;            // Ad Frequency
  
  // Creative Assets
  thumbnail?: string;
  videoUrl?: string;              // Für Video Ads
  imageUrl?: string;              // Für Image Ads
  headline?: string;
  description?: string;
  
  // Video-specific (nur für Video Ads)
  videoViews?: number;            // Video Views
  videoCompletions?: number;      // Video Completions
  videoCompletionRate?: number;   // Video Completion Rate
}

export interface WeeklyKPI {
  week: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cost: number;
  campaigns: number;
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

export interface Recommendation {
  id: string;
  type: 'creative' | 'budget' | 'targeting' | 'bidding';
  action: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export interface WeeklySnapshot {
  id: string;
  weekStart: string;
  weekEnd: string;
  insights: string[];
  recommendations: Recommendation[];
}

export interface DeepDiveData {
  topPerformingCampaigns: Campaign[];
  topPerformingCreatives: Creative[];
  performanceByDay: DailyKPI[];
  performanceByWeek: WeeklyKPI[];
  recentEvents: LogEvent[];
}
