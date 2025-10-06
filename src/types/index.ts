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
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cost: number;
  leads: number;
  cpm: number;
  cvr: number;
  cpl: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  type: 'image' | 'video' | 'carousel';
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  thumbnail?: string;
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

export interface LogEvent {
  id: string;
  timestamp: string;
  type: 'campaign_created' | 'campaign_paused' | 'budget_updated' | 'creative_rotation' | 'bid_adjustment';
  description: string;
  campaignId?: string;
  campaignName?: string;
  details?: Record<string, any>;
}

export interface DeepDiveData {
  topPerformingCampaigns: Campaign[];
  topPerformingCreatives: Creative[];
  performanceByDay: DailyKPI[];
  performanceByWeek: WeeklyKPI[];
  recentEvents: LogEvent[];
}
