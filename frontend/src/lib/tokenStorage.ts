/**
 * Storage for the refresh token only (the access token is kept in memory
 * inside AuthContext and never persisted). This is a plain localStorage
 * implementation for browser dev; Phase 4 (Capacitor) should swap this out
 * for a native secure-storage plugin (Android Keystore-backed) since
 * localStorage is not encrypted at rest.
 */
const REFRESH_TOKEN_KEY = "stocky-refresh-token";

export const tokenStorage = {
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
  },
  clearRefreshToken(): void {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
