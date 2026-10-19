import { SystemSettings, User, Category, SiteItem, AdItem, InviteCode, AdminStats } from './types';

const TOKEN_KEY = 'aurora_nav_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

declare global {
  interface Window {
    __PHP_HOST_ACTIVE__?: boolean;
    __PHP_API_BASE__?: string;
  }
}

// 智能全动态网络请求：优先直连 PHP 7.4 / MySQL 后端 (兼容任意虚拟主机与反向代理环境)
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-HTTP-Method-Override': method,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }

  const cleanRoute = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;

  // 判断是否处于真实线上 PHP 虚拟主机环境
  const isPhpHost = typeof window !== 'undefined' && (
    window.__PHP_HOST_ACTIVE__ ||
    (window.location.protocol.startsWith('http') && window.location.port !== '3000')
  );

  const candidateUrls: string[] = [];
  if (isPhpHost) {
    const apiBase = (typeof window !== 'undefined' && window.__PHP_API_BASE__) || 'api.php?route=';
    const separator = apiBase.includes('?') ? '&' : '?';
    const tokenQuery = token ? `${separator}token=${encodeURIComponent(token)}` : '';
    candidateUrls.push(`${apiBase}${cleanRoute}${tokenQuery}`);
    candidateUrls.push(`${endpoint}${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  } else {
    // 本地开发环境 (Node.js / Express 3000 端口)
    candidateUrls.push(endpoint);
    candidateUrls.push(`api.php?route=${cleanRoute}${token ? `&token=${encodeURIComponent(token)}` : ''}`);
  }

  let lastError: Error | null = null;

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errMsg = data?.error || `服务器处理失败 (HTTP ${res.status})`;
          throw new Error(errMsg);
        }

        if (data !== null) {
          return data as T;
        }
      }

      // 如果返回 404 且不是 JSON（说明该虚拟主机未配置该 URL 的伪静态），尝试下一个备选地址
      if (res.status === 404) {
        continue;
      }

      if (!res.ok) {
        throw new Error(`服务器响应异常 (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        lastError = err;
        // 如果是后端的明确业务报错（如密码错误、权限不足、卡密已使用、数据库错误），立即抛出给前端 UI 展示
        if (!err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          throw err;
        }
      }
    }
  }

  throw lastError || new Error('无法连接后端 API 数据库服务，请确认已上传 api.php 并完成数据库安装');
}

export const api = {
  // System
  getSettings: () => request<SystemSettings>('/api/system/settings'),
  installSystem: (payload: {
    siteName: string;
    siteSlogan: string;
    adminUsername: string;
    adminPassword: string;
    invitePurchaseUrl?: string;
    backgroundImageUrl?: string;
    logoUrl?: string;
  }) => request<{ success: boolean; message: string }>('/api/system/install', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Auth
  getMe: () => request<{ authenticated: boolean; user?: User }>('/api/auth/me'),
  login: (payload: { username: string; password: string }) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload: { username: string; password: string; nickname?: string; inviteCode: string }) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () => {
    setStoredToken(null);
    return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => ({ success: true }));
  },

  // Content
  getCategories: () => request<Category[]>('/api/categories'),
  getSites: () => request<SiteItem[]>('/api/sites'),
  clickSite: (id: string) =>
    request<{ success: boolean; url?: string; title?: string; requireLogin?: boolean; requireVip?: boolean }>(
      `/api/sites/click/${id}`,
      { method: 'POST' }
    ),
  submitSite: (payload: {
    title: string;
    url: string;
    description: string;
    categoryId: string;
    iconUrl?: string;
    tags?: string[];
  }) =>
    request<{ success: boolean; message: string; site: SiteItem }>('/api/sites/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Ads
  getAds: () => request<AdItem[]>('/api/ads'),
  clickAd: (id: string) => request<{ success: boolean }>(`/api/ads/click/${id}`, { method: 'POST' }),

  // Admin
  getAdminStats: () => request<AdminStats>('/api/admin/stats'),
  getAdminSites: () => request<SiteItem[]>('/api/admin/sites'),
  createAdminSite: (site: Partial<SiteItem>) =>
    request<{ success: boolean; site: SiteItem }>('/api/admin/sites', {
      method: 'POST',
      body: JSON.stringify(site),
    }),
  updateAdminSite: (id: string, site: Partial<SiteItem>) =>
    request<{ success: boolean; site: SiteItem }>(`/api/admin/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(site),
    }),
  deleteAdminSite: (id: string) =>
    request<{ success: boolean }>(`/api/admin/sites/${id}`, { method: 'DELETE' }),

  createAdminCategory: (category: Partial<Category>) =>
    request<{ success: boolean; category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),
  updateAdminCategory: (id: string, category: Partial<Category>) =>
    request<{ success: boolean; category?: Category }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),
  deleteAdminCategory: (id: string) =>
    request<{ success: boolean }>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  getAdminAds: () => request<AdItem[]>('/api/admin/ads'),
  createAdminAd: (ad: Partial<AdItem>) =>
    request<{ success: boolean; ad: AdItem }>('/api/admin/ads', {
      method: 'POST',
      body: JSON.stringify(ad),
    }),
  updateAdminAd: (id: string, ad: Partial<AdItem>) =>
    request<{ success: boolean; ad: AdItem }>(`/api/admin/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ad),
    }),
  deleteAdminAd: (id: string) =>
    request<{ success: boolean }>(`/api/admin/ads/${id}`, { method: 'DELETE' }),

  getAdminInviteCodes: () => request<InviteCode[]>('/api/admin/invite-codes'),
  generateInviteCodes: (payload: {
    count: number;
    prefix: string;
    vipDays: number;
    vipTier: 'vip' | 'svip';
    remark: string;
  }) =>
    request<{ success: boolean; count: number; codes: InviteCode[] }>('/api/admin/invite-codes/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAdminInviteCode: (id: string) =>
    request<{ success: boolean }>(`/api/admin/invite-codes/${id}`, { method: 'DELETE' }),
  updateAdminInviteCode: (id: string, updates: Partial<InviteCode>) =>
    request<{ success: boolean; code: InviteCode }>(`/api/admin/invite-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  getAdminUsers: () => request<User[]>('/api/admin/users'),
  updateAdminUser: (id: string, updates: Record<string, unknown>) =>
    request<{ success: boolean; user: User }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteAdminUser: (id: string) =>
    request<{ success: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  getAdminSettings: () => request<SystemSettings>('/api/admin/settings'),
  updateAdminSettings: (settings: Partial<SystemSettings>) =>
    request<{ success: boolean; settings: SystemSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetDemoData: () => request<{ success: boolean; message: string }>('/api/admin/reset', { method: 'POST' }),
};
