export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  variables: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsvFile {
  id: string;
  name: string;
  original_filename: string;
  storage_path: string;
  row_count: number;
  column_mapping: Record<string, string>;
  is_filtered: boolean;
  parent_file_id: string | null;
  filter_criteria: {
    countries?: string[];
    timezones?: string[];
    emailDomains?: string[];
  } | null;
  status: 'processing' | 'ready' | 'error';
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsvContact {
  id: string;
  csv_file_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  timezone: string | null;
  phone: string | null;
  company: string | null;
  custom_fields: Record<string, unknown>;
  is_valid: boolean;
  validation_error: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  csv_file_id: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  subject_override: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  send_options: Record<string, unknown>;
  stats: CampaignStats;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template?: Template;
  csv_file?: CsvFile;
}

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
}

export interface CampaignEmail {
  id: string;
  campaign_id: string;
  csv_contact_id: string;
  email_address: string;
  recipient_name: string | null;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  csv_contact?: CsvContact;
}

export interface EmailEvent {
  id: number;
  campaign_email_id: string;
  event_type: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  event_data: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  occurred_at: string;
}

export interface DashboardStats {
  campaigns: {
    total: number;
    draft: number;
    scheduled: number;
    sending: number;
    sent: number;
    paused: number;
    cancelled: number;
  };
  templates: number;
  csvFiles: number;
  contacts: number;
  emails: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    unsubscribed: number;
  };
  weeklyChanges?: {
    campaigns: number;
    templates: number;
    csvFiles: number;
    contacts: number;
  };
}

export interface FilterOptions {
  countries: string[];
  timezones: string[];
  emailDomains: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Advertisement Types
export interface Advertisement {
  id: string;
  name: string;
  description: string | null;
  destination_url: string;
  tracking_code: string;
  platform: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_active: boolean;
  stats: AdStats;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdStats {
  clicks: number;
  unique_clicks: number;
}

export interface AdClick {
  id: string;
  advertisement_id: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  clicked_at: string;
}

export interface AdDailyStats {
  date: string;
  count: number;
}

export interface AdBreakdown {
  name: string;
  count: number;
}

export interface AdDetailedStats {
  advertisement: Advertisement;
  dailyStats: AdDailyStats[];
  deviceBreakdown: AdBreakdown[];
  browserBreakdown: AdBreakdown[];
  osBreakdown: AdBreakdown[];
  hourlyDistribution: { hour: number; count: number }[];
  totalClicks: number;
  periodDays: number;
}

export interface AdDashboardStats {
  totalAds: number;
  activeAds: number;
  totalClicks: number;
  topAds: {
    id: string;
    name: string;
    stats: AdStats;
    platform: string | null;
  }[];
}

