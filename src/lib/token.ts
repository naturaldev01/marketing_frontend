// Token management utilities - stores tokens in localStorage
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
}

export const tokenManager = {
  // Save tokens to localStorage
  setTokens: (data: TokenData) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    
    // Calculate expiry time
    if (data.expires_at) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(data.expires_at));
    } else if (data.expires_in) {
      const expiryTime = Math.floor(Date.now() / 1000) + data.expires_in;
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime));
    }
  },

  // Get access token
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Check if token is expired (with 5 minute buffer)
  isTokenExpired: (): boolean => {
    if (typeof window === 'undefined') return true;
    
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    const expiryTime = parseInt(expiry, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferSeconds = 5 * 60; // 5 minutes buffer
    
    return currentTime >= (expiryTime - bufferSeconds);
  },

  // Clear all tokens
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  // Check if user has tokens (is potentially logged in)
  hasTokens: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};
