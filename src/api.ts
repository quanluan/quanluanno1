import { SystemSettings, User, Category, SiteItem, AdItem, InviteCode, AdminStats } from './types';

const TOKEN_KEY = 'aurora_nav_token';
const VHOST_DB_KEY = 'aurora_virtual_host_db';

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

// Default seed data
const defaultVhostSettings: SystemSettings = {
  installed: true,
  siteName: '极光VIP精选资源导航',
  siteSlogan: '专为互联网专业人士甄选的生产力工具与技术枢纽',
  siteNotice: '欢迎访问极光精选导航，全站收录站点均经严格安全与性能核验。',
  showNotice: true,
  invitePurchaseUrl: 'https://t.me/aurora_vip_nav',
  invitePurchaseButtonText: '开通VIP卡密',
  forceLoginToViewUrl: true,
  allowPublicSubmission: true,
  autoApproveSubmission: false,
  defaultVipDays: 30,
  contactEmail: 'admin@auroranav.com',
  telegramGroup: '@aurora_vip_nav',
  backgroundImageUrl: '',
  logoUrl: '',
};

const defaultVhostCategories: Category[] = [
  { id: 'cat-ai', name: 'AI 人工智能', icon: 'Bot', description: '前沿大语言模型与AI原生生产力工具', sortOrder: 1 },
  { id: 'cat-dev', name: '开发技术', icon: 'Code2', description: '代码托管、极客开发框架与云端部署平台', sortOrder: 2 },
  { id: 'cat-design', name: '设计灵感', icon: 'Palette', description: 'UI/UX设计资产、3D渲染与创意灵感库', sortOrder: 3 },
  { id: 'cat-tools', name: '效能工具', icon: 'Wrench', description: '在线高质压缩、转换与日常实用瑞士军刀', sortOrder: 4 },
  { id: 'cat-media', name: '独立出海', icon: 'Sparkles', description: '海外流量开拓、出海SaaS与媒体分发渠道', sortOrder: 5 },
  { id: 'cat-cross', name: '跨境支付', icon: 'Globe', description: '国际支付结算、企业跨境合规与外币收单', sortOrder: 6 },
];

const defaultVhostSites: SiteItem[] = [
  {
    id: 'site-1',
    title: 'Google Gemini',
    url: 'https://gemini.google.com',
    description: '谷歌新一代多模态旗舰大语言模型，支持超长上下文及代码智能生成。',
    categoryId: 'cat-ai',
    iconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    tags: ['AI 助手', '多模态', '大模型', '谷歌'],
    isPinned: true,
    isFeatured: true,
    minVipTier: 'all',
    status: 'approved',
    clickCount: 1420,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-2',
    title: 'DeepSeek 深度求索',
    url: 'https://chat.deepseek.com',
    description: '开源低成本高智商超强大模型，长推理与深度代码能力行业领先。',
    categoryId: 'cat-ai',
    iconUrl: 'https://chat.deepseek.com/favicon.ico',
    tags: ['国产大模型', '代码推理', '开源'],
    isPinned: true,
    isFeatured: true,
    minVipTier: 'all',
    status: 'approved',
    clickCount: 1980,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-3',
    title: 'GitHub',
    url: 'https://github.com',
    description: '全球最大的开发者协同与开源代码托管平台，全球程序员必备工具。',
    categoryId: 'cat-dev',
    iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
    tags: ['开发社区', 'Git', '开源托管'],
    isPinned: true,
    isFeatured: false,
    minVipTier: 'all',
    status: 'approved',
    clickCount: 1120,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-4',
    title: 'Vercel 云端部署',
    url: 'https://vercel.com',
    description: '现代全栈前端与边缘计算自动化 CI/CD 平台，Next.js 官方母公司。',
    categoryId: 'cat-dev',
    iconUrl: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico',
    tags: ['Serverless', '自动化部署', 'Next.js'],
    isPinned: false,
    isFeatured: true,
    minVipTier: 'all',
    status: 'approved',
    clickCount: 890,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-5',
    title: 'Figma 协同设计',
    url: 'https://www.figma.com',
    description: '全球最顶尖的团队协作在线 UI/UX 设计与原型交互平台。',
    categoryId: 'cat-design',
    iconUrl: 'https://static.figma.com/app/icon/1/favicon.png',
    tags: ['UI 设计', '原型协同', '设计系统'],
    isPinned: false,
    isFeatured: true,
    minVipTier: 'all',
    status: 'approved',
    clickCount: 760,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-6',
    title: 'Midjourney 创意生成',
    url: 'https://www.midjourney.com',
    description: '艺术质感超凡的文生图人工智能工具，设计师概念发散神器。',
    categoryId: 'cat-design',
    iconUrl: 'https://www.midjourney.com/favicon.ico',
    tags: ['AI 绘画', '创意设计', 'VIP精选'],
    isPinned: false,
    isFeatured: true,
    minVipTier: 'vip',
    status: 'approved',
    clickCount: 1530,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-7',
    title: 'TinyPNG 智能图片压缩',
    url: 'https://tinypng.com',
    description: '行业智能有损压缩 WebP/PNG/JPG 图片引擎，有效缩减站点静态带宽。',
    categoryId: 'cat-tools',
    iconUrl: 'https://tinypng.com/images/favicon.ico',
    tags: ['图片压缩', 'Web 优化', '实用工具'],
    isPinned: false,
    isFeatured: false,
    minVipTier: 'all',
    status: 'approved',
    clickCount: 620,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site-8',
    title: 'Cursor AI 编程编辑器',
    url: 'https://www.cursor.com',
    description: '基于 VSCode 深度改造的 AI 原生代码编辑器，跨文件全栈智能重构。',
    categoryId: 'cat-dev',
    iconUrl: 'https://www.cursor.com/favicon.ico',
    tags: ['AI 编程', 'VSCode 增强', 'VIP精选'],
    isPinned: true,
    isFeatured: true,
    minVipTier: 'vip',
    status: 'approved',
    clickCount: 1670,
    createdAt: new Date().toISOString(),
  },
];

const defaultVhostAds: AdItem[] = [
  {
    id: 'ad-top-1',
    title: '全球优质低延迟高防云服务器特惠专区',
    position: 'top_banner',
    imageUrl: '',
    targetUrl: 'https://cloud.google.com',
    badgeText: '精选赞助',
    description: 'BGP优质线路 / 弹性伸缩极速响应 / 99.99%高可用SLA保障，助力企业出海首选。',
    isActive: true,
    clickCount: 382,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-card-1',
    title: '跨境出海全球多币种企业虚拟卡服务',
    position: 'grid_sponsor',
    imageUrl: '',
    targetUrl: 'https://stripe.com',
    badgeText: '官方赞助',
    description: '支持海外营销投流扣费、SaaS订阅及海外云主机付款，即开即用汇率透明。',
    isActive: true,
    clickCount: 219,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-card-2',
    title: 'AI 应用全球加速高防 CDN 专线节点',
    position: 'grid_sponsor',
    imageUrl: '',
    targetUrl: 'https://github.com',
    badgeText: '战略合作',
    description: '毫秒级全链路动态路由优化，支持大模型流式传输高并发缓冲。',
    isActive: true,
    clickCount: 145,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
];

const defaultVhostInviteCodes: InviteCode[] = [
  {
    id: 'code-1',
    code: 'VIP888-2026',
    vipDays: 30,
    vipTier: 'vip',
    vipTierName: 'VIP 月度会员',
    status: 'unused',
    usedByUserId: null,
    usedByUsername: null,
    usedAt: null,
    createdAt: new Date().toISOString(),
    remark: '系统初始化激活码',
  },
];

interface VhostDatabase {
  settings: SystemSettings;
  users: Array<User & { password?: string }>;
  inviteCodes: InviteCode[];
  categories: Category[];
  sites: SiteItem[];
  ads: AdItem[];
}

let memoryStore: VhostDatabase | null = null;

function safeGetStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {
    // ignore
  }
}

function getVhostDB(): VhostDatabase {
  if (memoryStore) {
    return memoryStore;
  }
  const raw = safeGetStorage(VHOST_DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.settings && Array.isArray(parsed.sites)) {
        memoryStore = parsed;
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  const initial: VhostDatabase = {
    settings: defaultVhostSettings,
    users: [
      {
        id: 'user-admin',
        username: 'admin',
        nickname: '超级管理员',
        password: 'admin888',
        role: 'admin',
        vipTier: 'svip',
        vipTierName: 'SVIP 终身至尊',
        vipExpireAt: null,
        isExpired: false,
        isLifetime: true,
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ],
    inviteCodes: defaultVhostInviteCodes,
    categories: defaultVhostCategories,
    sites: defaultVhostSites,
    ads: defaultVhostAds,
  };
  memoryStore = initial;
  safeSetStorage(VHOST_DB_KEY, JSON.stringify(initial));
  return initial;
}

function saveVhostDB(db: VhostDatabase) {
  memoryStore = db;
  safeSetStorage(VHOST_DB_KEY, JSON.stringify(db));
}

let isVhostMode = false;

async function tryFetchJson<T>(url: string, options: RequestInit, token: string | null): Promise<T | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json().catch(() => null);
      if (data !== null) return data as T;
    }
  } catch {
    // network failure
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (isVhostMode) {
    return handleVhostRequest<T>(endpoint, options);
  }
  const token = getStoredToken();
  const directData = await tryFetchJson<T>(endpoint, options, token);
  if (directData !== null) return directData;

  // Fallback to client-side storage engine
  isVhostMode = true;
  return handleVhostRequest<T>(endpoint, options);
}

function handleVhostRequest<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const token = getStoredToken();
  const db = getVhostDB();
  const currentUser = token ? db.users.find(u => u.id === token) : undefined;
  const isAdmin = currentUser?.role === 'admin';
  const isVip = isAdmin || (currentUser && (!currentUser.vipExpireAt || currentUser.vipExpireAt > Date.now()));

  // 1. Settings
  if (endpoint === '/api/system/settings') {
    return db.settings as unknown as T;
  }

  // 2. Install
  if (endpoint === '/api/system/install' && method === 'POST') {
    db.settings.installed = true;
    db.settings.siteName = body.siteName || db.settings.siteName;
    db.settings.siteSlogan = body.siteSlogan || db.settings.siteSlogan;
    db.settings.invitePurchaseUrl = body.invitePurchaseUrl || db.settings.invitePurchaseUrl;
    db.settings.backgroundImageUrl = body.backgroundImageUrl || '';
    if (body.logoUrl !== undefined) {
      db.settings.logoUrl = body.logoUrl;
    }

    const existingAdminIdx = db.users.findIndex(u => u.username === body.adminUsername);
    if (existingAdminIdx >= 0) {
      db.users[existingAdminIdx].password = body.adminPassword;
      db.users[existingAdminIdx].role = 'admin';
      db.users[existingAdminIdx].vipTier = 'svip';
      db.users[existingAdminIdx].vipExpireAt = null;
    } else {
      db.users.push({
        id: 'admin-' + Date.now(),
        username: body.adminUsername,
        nickname: '超级管理员',
        password: body.adminPassword,
        role: 'admin',
        vipTier: 'svip',
        vipTierName: '超级管理员',
        vipExpireAt: null,
        isExpired: false,
        isLifetime: true,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
    }
    saveVhostDB(db);
    return { success: true, message: '配置已更新完成' } as unknown as T;
  }

  // 3. Auth Me
  if (endpoint === '/api/auth/me') {
    if (currentUser) {
      return { authenticated: true, user: currentUser } as unknown as T;
    }
    return { authenticated: false } as unknown as T;
  }

  // 4. Auth Login
  if (endpoint === '/api/auth/login' && method === 'POST') {
    const user = db.users.find(u => u.username.toLowerCase() === body.username.toLowerCase());
    if (!user || user.password !== body.password) {
      throw new Error('用户名或密码不正确');
    }
    setStoredToken(user.id);
    return { success: true, token: user.id, user, message: '登录成功' } as unknown as T;
  }

  // 5. Auth Register
  if (endpoint === '/api/auth/register' && method === 'POST') {
    const code = db.inviteCodes.find(c => c.code.trim().toUpperCase() === (body.inviteCode || '').trim().toUpperCase());
    if (!code) throw new Error('无效的卡密激活码，请核验后重新输入');
    if (code.status === 'used') throw new Error('该卡密已被使用，请获取新的激活卡密');

    const existing = db.users.find(u => u.username.toLowerCase() === body.username.toLowerCase());
    if (existing) throw new Error('该用户名已被占用，请更换其他名称');

    const now = Date.now();
    const expireAt = code.vipDays >= 9999 ? null : now + code.vipDays * 86400 * 1000;
    const newUser: User & { password?: string } = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      username: body.username,
      nickname: body.nickname || body.username,
      password: body.password,
      role: 'user',
      vipTier: code.vipTier,
      vipTierName: code.vipTierName,
      vipExpireAt: expireAt,
      isExpired: false,
      isLifetime: code.vipDays >= 9999,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    db.users.push(newUser);
    code.status = 'used';
    code.usedByUserId = newUser.id;
    code.usedByUsername = newUser.username;
    code.usedAt = new Date().toISOString();
    saveVhostDB(db);
    setStoredToken(newUser.id);
    return { success: true, token: newUser.id, user: newUser, message: `注册成功，已激活 ${code.vipTierName}` } as unknown as T;
  }

  // 6. Categories
  if (endpoint === '/api/categories') {
    return db.categories.sort((a, b) => a.sortOrder - b.sortOrder) as unknown as T;
  }

  // 7. Sites
  if (endpoint === '/api/sites') {
    const sites = db.sites.filter(s => s.status === 'approved' || !s.status);
    const masked = sites.map(s => {
      const isLocked = db.settings.forceLoginToViewUrl && !currentUser;
      const isVipLocked = s.minVipTier !== 'all' && !isVip;
      return {
        ...s,
        url: isLocked || isVipLocked ? null : s.url,
        isLocked: isLocked || isVipLocked,
        lockReason: isLocked ? 'require_login' : isVipLocked ? 'require_vip' : null,
      };
    });
    return masked as unknown as T;
  }

  // 8. Site click
  if (endpoint.startsWith('/api/sites/click/')) {
    const id = endpoint.split('/')[4];
    const site = db.sites.find(s => s.id === id);
    if (!site) throw new Error('站点不存在');
    if (db.settings.forceLoginToViewUrl && !currentUser) {
      throw new Error('请先登录以访问此收录站点');
    }
    site.clickCount = (site.clickCount || 0) + 1;
    saveVhostDB(db);
    return { success: true, url: site.url, title: site.title } as unknown as T;
  }

  // 9. Submit site
  if (endpoint === '/api/sites/submit' && method === 'POST') {
    const newSite: SiteItem = {
      id: 'site-' + Date.now(),
      title: body.title,
      url: body.url,
      description: body.description || '',
      categoryId: body.categoryId,
      iconUrl: body.iconUrl || '',
      tags: body.tags || [],
      isPinned: false,
      isFeatured: false,
      minVipTier: 'all',
      status: db.settings.autoApproveSubmission || isAdmin ? 'approved' : 'pending',
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.sites.unshift(newSite);
    saveVhostDB(db);
    return { success: true, site: newSite, message: '提交成功，已加入目录' } as unknown as T;
  }

  // 10. Ads
  if (endpoint === '/api/ads') {
    return db.ads.filter(a => a.isActive) as unknown as T;
  }

  // 11. Admin Stats
  if (endpoint === '/api/admin/stats') {
    const totalClicks = db.sites.reduce((sum, s) => sum + (s.clickCount || 0), 0);
    const now = Date.now();
    const activeVipUsers = db.users.filter(u => u.role === 'admin' || !u.vipExpireAt || u.vipExpireAt > now).length;
    const unusedCodes = db.inviteCodes.filter(c => c.status === 'unused').length;
    return {
      totalUsers: db.users.length,
      activeVipUsers,
      totalSites: db.sites.length,
      pendingSites: db.sites.filter(s => s.status === 'pending').length,
      totalCodes: db.inviteCodes.length,
      unusedCodes,
      totalAds: db.ads.length,
      totalClicks,
    } as unknown as T;
  }

  // 12. Admin Sites CRUD
  if (endpoint === '/api/admin/sites' && method === 'GET') {
    return db.sites as unknown as T;
  }
  if (endpoint === '/api/admin/sites' && method === 'POST') {
    const newSite: SiteItem = {
      id: 'site-' + Date.now(),
      ...body,
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.sites.unshift(newSite);
    saveVhostDB(db);
    return { success: true, site: newSite } as unknown as T;
  }
  if (endpoint.startsWith('/api/admin/sites/') && method === 'PUT') {
    const id = endpoint.split('/')[4];
    const idx = db.sites.findIndex(s => s.id === id);
    if (idx >= 0) {
      db.sites[idx] = { ...db.sites[idx], ...body };
      saveVhostDB(db);
      return { success: true, site: db.sites[idx] } as unknown as T;
    }
  }
  if (endpoint.startsWith('/api/admin/sites/') && method === 'DELETE') {
    const id = endpoint.split('/')[4];
    db.sites = db.sites.filter(s => s.id !== id);
    saveVhostDB(db);
    return { success: true } as unknown as T;
  }

  // 13. Admin Invite Codes
  if (endpoint === '/api/admin/invite-codes' && method === 'GET') {
    return db.inviteCodes as unknown as T;
  }
  if (endpoint === '/api/admin/invite-codes/generate' && method === 'POST') {
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 100);
    const generated: InviteCode[] = [];
    for (let i = 0; i < count; i++) {
      const codeStr = `${(body.prefix || 'VIP').toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      generated.push({
        id: 'inv-' + Date.now() + '-' + i,
        code: codeStr,
        vipDays: Number(body.vipDays) || 30,
        vipTier: body.vipTier || 'vip',
        vipTierName: body.vipDays >= 9999 ? 'SVIP 终身至尊' : `VIP 会员 (${body.vipDays}天)`,
        status: 'unused',
        usedByUserId: null,
        usedByUsername: null,
        usedAt: null,
        createdAt: new Date().toISOString(),
        remark: body.remark || '后台管理生成',
      });
    }
    db.inviteCodes.unshift(...generated);
    saveVhostDB(db);
    return { success: true, count: generated.length, codes: generated } as unknown as T;
  }
  if (endpoint.startsWith('/api/admin/invite-codes/') && method === 'DELETE') {
    const id = endpoint.split('/')[4];
    db.inviteCodes = db.inviteCodes.filter(c => c.id !== id);
    saveVhostDB(db);
    return { success: true } as unknown as T;
  }

  // 14. Admin Users
  if (endpoint === '/api/admin/users' && method === 'GET') {
    return db.users as unknown as T;
  }
  if (endpoint.startsWith('/api/admin/users/') && method === 'PUT') {
    const id = endpoint.split('/')[4];
    const user = db.users.find(u => u.id === id);
    if (user) {
      if (body.setLifetime) {
        user.vipExpireAt = null;
        user.isLifetime = true;
      } else if (body.vipDaysToAdd) {
        const cur = user.vipExpireAt && user.vipExpireAt > Date.now() ? user.vipExpireAt : Date.now();
        user.vipExpireAt = cur + Number(body.vipDaysToAdd) * 86400 * 1000;
      }
      if (body.vipTier) user.vipTier = body.vipTier;
      if (body.role) user.role = body.role;
      saveVhostDB(db);
      return { success: true, user } as unknown as T;
    }
  }

  // 15. Admin Categories
  if (endpoint === '/api/admin/categories' && method === 'POST') {
    const newCat = { id: 'cat-' + Date.now(), ...body };
    db.categories.push(newCat);
    saveVhostDB(db);
    return { success: true, category: newCat } as unknown as T;
  }
  if (endpoint.startsWith('/api/admin/categories/') && method === 'DELETE') {
    const id = endpoint.split('/')[4];
    db.categories = db.categories.filter(c => c.id !== id);
    saveVhostDB(db);
    return { success: true } as unknown as T;
  }

  // 16. Admin Ads
  if (endpoint === '/api/admin/ads' && method === 'GET') {
    return db.ads as unknown as T;
  }
  if (endpoint === '/api/admin/ads' && method === 'POST') {
    const newAd = { id: 'ad-' + Date.now(), clickCount: 0, createdAt: new Date().toISOString(), ...body };
    db.ads.push(newAd);
    saveVhostDB(db);
    return { success: true, ad: newAd } as unknown as T;
  }
  if (endpoint.startsWith('/api/admin/ads/') && method === 'DELETE') {
    const id = endpoint.split('/')[4];
    db.ads = db.ads.filter(a => a.id !== id);
    saveVhostDB(db);
    return { success: true } as unknown as T;
  }

  // 17. Admin Settings
  if (endpoint === '/api/admin/settings' && method === 'GET') {
    return db.settings as unknown as T;
  }
  if (endpoint === '/api/admin/settings' && method === 'PUT') {
    db.settings = { ...db.settings, ...body };
    saveVhostDB(db);
    return { success: true, settings: db.settings } as unknown as T;
  }

  // 18. Reset demo
  if (endpoint === '/api/admin/reset') {
    localStorage.removeItem(VHOST_DB_KEY);
    return { success: true, message: '已重置系统数据' } as unknown as T;
  }

  return {} as unknown as T;
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
    request<{ success: boolean; category: Category }>(`/api/admin/categories/${id}`, {
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

  exportBackupData: () => {
    const raw = localStorage.getItem(VHOST_DB_KEY);
    return raw || JSON.stringify(getVhostDB(), null, 2);
  },
};
