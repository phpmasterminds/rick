export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  conversions: number;
  startDate: string;
  endDate: string;
  image?: string;
}

export interface AnalyticsData {
  date: string;
  clicks: number;
  impressions: number;
  conversions: number;
  spend: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ThemeColor {
  name: string;
  color: string;
  label: string;
}