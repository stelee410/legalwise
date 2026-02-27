/**
 * 认证状态存储 - 供整站请求携带 X-API-Key
 * 登录/注册成功后写入，登出时清除
 */
const STORAGE_KEY_API_KEY = 'legalwise_api_key';
const STORAGE_KEY_USER = 'legalwise_user';

export interface StoredUser {
  id: string;
  username?: string;
  [k: string]: unknown;
}

export function setAuth(apiKey: string, user?: StoredUser | null): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch {
    // ignore
  }
}

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_API_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {
    // ignore
  }
}
