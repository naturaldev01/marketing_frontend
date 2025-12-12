import { tokenManager } from './token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

// Refresh token if needed
async function refreshTokenIfNeeded(): Promise<string | null> {
  const accessToken = tokenManager.getAccessToken();
  
  if (!accessToken) return null;
  
  // Check if token is expired
  if (tokenManager.isTokenExpired()) {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      tokenManager.clearTokens();
      return null;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        tokenManager.clearTokens();
        return null;
      }
      
      const data = await response.json();
      tokenManager.setTokens(data.session);
      return data.session.access_token;
    } catch {
      tokenManager.clearTokens();
      return null;
    }
  }
  
  return accessToken;
}

async function fetchWithAuth(endpoint: string, options: RequestOptions = {}) {
  const { params, skipAuth, ...fetchOptions } = options;
  
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Get token (refresh if needed)
  const token = skipAuth ? null : await refreshTokenIfNeeded();

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    
    // If unauthorized and we have tokens, clear them
    if (response.status === 401 && tokenManager.hasTokens()) {
      tokenManager.clearTokens();
    }
    
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

// Auth API - these don't need auth token
export const authApi = {
  signUp: async (data: { email: string; password: string; fullName?: string }) => {
    const response = await fetchWithAuth('/api/auth/signup', { 
      method: 'POST', 
      body: JSON.stringify(data),
      skipAuth: true,
    });
    // Save tokens after signup
    if (response.session) {
      tokenManager.setTokens(response.session);
    }
    return response;
  },
  
  signIn: async (data: { email: string; password: string }) => {
    const response = await fetchWithAuth('/api/auth/signin', { 
      method: 'POST', 
      body: JSON.stringify(data),
      skipAuth: true,
    });
    // Save tokens after signin
    if (response.session) {
      tokenManager.setTokens(response.session);
    }
    return response;
  },
  
  signOut: async () => {
    try {
      await fetchWithAuth('/api/auth/signout', { method: 'POST' });
    } finally {
      // Always clear tokens on signout
      tokenManager.clearTokens();
    }
  },
  
  refreshToken: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await fetchWithAuth('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
    
    if (response.session) {
      tokenManager.setTokens(response.session);
    }
    return response;
  },
  
  getMe: () => fetchWithAuth('/api/auth/me'),
  getProfile: () => fetchWithAuth('/api/auth/profile'),
  updateProfile: (data: { full_name?: string; role?: string }) =>
    fetchWithAuth('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Templates API
export const templatesApi = {
  getAll: (params?: { isActive?: string; search?: string }) =>
    fetchWithAuth('/api/templates', { params }),
  getOne: (id: string) => fetchWithAuth(`/api/templates/${id}`),
  create: (data: {
    name: string;
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    variables?: string[];
    isActive?: boolean;
  }) => fetchWithAuth('/api/templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{
    name: string;
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    variables?: string[];
    isActive?: boolean;
  }>) => fetchWithAuth(`/api/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWithAuth(`/api/templates/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => fetchWithAuth(`/api/templates/${id}/duplicate`, { method: 'POST' }),
  extractVariables: (content: string) =>
    fetchWithAuth('/api/templates/extract-variables', { method: 'POST', body: JSON.stringify({ content }) }),
};

// CSV Files API
export const csvFilesApi = {
  getAll: (params?: { isFiltered?: string; status?: string }) =>
    fetchWithAuth('/api/csv-files', { params }),
  getOne: (id: string) => fetchWithAuth(`/api/csv-files/${id}`),
  upload: async (file: File, name: string) => {
    const token = await refreshTokenIfNeeded();
    
    if (!token) {
      throw new Error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    
    const response = await fetch(`${API_URL}/api/csv-files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Dosya yüklenemedi' }));
      throw new Error(error.message || 'Dosya yüklenemedi');
    }
    
    return response.json();
  },
  getContacts: (id: string, params?: { page?: string; limit?: string; isValid?: string }) =>
    fetchWithAuth(`/api/csv-files/${id}/contacts`, { params }),
  getFilterOptions: (id: string) => fetchWithAuth(`/api/csv-files/${id}/filter-options`),
  filter: (id: string, data: {
    name?: string;
    countries?: string[];
    timezones?: string[];
    emailDomains?: string[];
  }) => fetchWithAuth(`/api/csv-files/${id}/filter`, { method: 'POST', body: JSON.stringify(data) }),
  getStats: (id: string) => fetchWithAuth(`/api/csv-files/${id}/stats`),
  delete: (id: string) => fetchWithAuth(`/api/csv-files/${id}`, { method: 'DELETE' }),
};

// Campaigns API
export const campaignsApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    fetchWithAuth('/api/campaigns', { params }),
  getOne: (id: string) => fetchWithAuth(`/api/campaigns/${id}`),
  create: (data: {
    name: string;
    description?: string;
    templateId?: string;
    csvFileId?: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    subjectOverride?: string;
    sendOptions?: Record<string, unknown>;
  }) => fetchWithAuth('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{
    name: string;
    description?: string;
    templateId?: string;
    csvFileId?: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    subjectOverride?: string;
    sendOptions?: Record<string, unknown>;
  }>) => fetchWithAuth(`/api/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWithAuth(`/api/campaigns/${id}`, { method: 'DELETE' }),
  schedule: (id: string, scheduledAt: string, timezone?: string) =>
    fetchWithAuth(`/api/campaigns/${id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt, timezone }) }),
  start: (id: string) => fetchWithAuth(`/api/campaigns/${id}/start`, { method: 'POST' }),
  pause: (id: string) => fetchWithAuth(`/api/campaigns/${id}/pause`, { method: 'POST' }),
  cancel: (id: string) => fetchWithAuth(`/api/campaigns/${id}/cancel`, { method: 'POST' }),
  duplicate: (id: string) => fetchWithAuth(`/api/campaigns/${id}/duplicate`, { method: 'POST' }),
  getEmails: (id: string, params?: { status?: string; page?: string; limit?: string }) =>
    fetchWithAuth(`/api/campaigns/${id}/emails`, { params }),
};

// Reports API
export const reportsApi = {
  getDashboard: () => fetchWithAuth('/api/reports/dashboard'),
  getEmailPerformance: (days?: number) =>
    fetchWithAuth('/api/reports/email-performance', { params: days ? { days: days.toString() } : undefined }),
  getCampaignReport: (id: string) => fetchWithAuth(`/api/reports/campaigns/${id}`),
  getRecentActivity: (limit?: number) =>
    fetchWithAuth('/api/reports/activity', { params: limit ? { limit: limit.toString() } : undefined }),
  getEmailDetails: (id: string) => fetchWithAuth(`/api/reports/emails/${id}`),
  compareCampaigns: (ids: string[]) =>
    fetchWithAuth('/api/reports/compare', { params: { ids: ids.join(',') } }),
  exportCampaignReport: (id: string) => fetchWithAuth(`/api/reports/campaigns/${id}/export`),
};

