import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  nickname: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  avatar?: string;
  inviteCodeUsed?: string;
  vipTier: 'free' | 'vip' | 'svip';
  vipTierName: string;
  vipExpireAt: number | null; // Unix timestamp in ms, null means Lifetime (永久)
  createdAt: string;
  status: 'active' | 'banned';
}

export interface InviteCode {
  id: string;
  code: string;
  vipDays: number; // e.g. 7, 30, 90, 365, 9999 (9999 = Lifetime)
  vipTier: 'vip' | 'svip';
  vipTierName: string;
  status: 'unused' | 'used' | 'disabled';
  usedByUserId: string | null;
  usedByUsername: string | null;
  usedAt: string | null;
  createdAt: string;
  remark: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
}

export interface SiteItem {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string;
  iconUrl?: string;
  tags: string[];
  isPinned: boolean;
  isFeatured: boolean;
  minVipTier: 'all' | 'vip' | 'svip';
  status: 'approved' | 'pending' | 'rejected';
  submitterId: string | null;
  submitterName: string | null;
  clickCount: number;
  createdAt: string;
}

export interface AdItem {
  id: string;
  title: string;
  position: 'top_banner' | 'grid_sponsor' | 'bottom_banner';
  imageUrl: string;
  targetUrl: string;
  badgeText: string;
  description: string;
  isActive: boolean;
  clickCount: number;
  sortOrder: number;
  createdAt: string;
}

export interface SystemSettings {
  installed: boolean;
  siteName: string;
  siteSlogan: string;
  siteNotice: string;
  showNotice: boolean;
  invitePurchaseUrl: string;
  invitePurchaseButtonText: string;
  forceLoginToViewUrl: boolean;
  allowPublicSubmission: boolean;
  autoApproveSubmission: boolean;
  defaultVipDays: number;
  contactEmail: string;
  telegramGroup: string;
  backgroundImageUrl: string;
  logoUrl?: string;
}

export interface DatabaseSchema {
  settings: SystemSettings;
  users: User[];
  inviteCodes: InviteCode[];
  categories: Category[];
  sites: SiteItem[];
  ads: AdItem[];
  sessions: { [token: string]: { userId: string; createdAt: number } };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'nav_data.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashNewPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  return hashPassword(password, salt) === hash;
}

// Initial default seed
const defaultAdminSalt = 'e8b83920c78a01f9c8914b72';
const defaultAdminHash = hashPassword('admin888', defaultAdminSalt);

const defaultCategories: Category[] = [
  { id: 'cat-ai', name: 'AI 人工智能', icon: 'Bot', description: '前沿大语言模型与AI原生生产力工具', sortOrder: 1 },
  { id: 'cat-dev', name: '开发技术', icon: 'Code2', description: '代码托管、极客开发框架与云端部署平台', sortOrder: 2 },
  { id: 'cat-design', name: '设计灵感', icon: 'Palette', description: 'UI/UX设计资产、3D渲染与创意灵感库', sortOrder: 3 },
  { id: 'cat-tools', name: '效能工具', icon: 'Wrench', description: '在线高质压缩、转换与日常实用瑞士军刀', sortOrder: 4 },
  { id: 'cat-media', name: '独立出海', icon: 'Sparkles', description: '海外流量开拓、出海SaaS与媒体分发渠道', sortOrder: 5 },
  { id: 'cat-cross', name: '跨境支付', icon: 'Globe', description: '国际支付结算、企业跨境合规与外币收单', sortOrder: 6 },
];

const defaultSites: SiteItem[] = [
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
    submitterId: null,
    submitterName: '系统预置',
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
    submitterId: null,
    submitterName: '系统预置',
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
    submitterId: null,
    submitterName: '系统预置',
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
    submitterId: null,
    submitterName: '系统预置',
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
    submitterId: null,
    submitterName: '系统预置',
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
    submitterId: null,
    submitterName: '系统预置',
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
    tags: ['图片压缩', 'Web 优化', '工具'],
    isPinned: false,
    isFeatured: false,
    minVipTier: 'all',
    status: 'approved',
    submitterId: null,
    submitterName: '系统预置',
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
    submitterId: null,
    submitterName: '系统预置',
    clickCount: 1670,
    createdAt: new Date().toISOString(),
  },
];

const defaultInviteCodes: InviteCode[] = [
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

const defaultAds: AdItem[] = [
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

const defaultSettings: SystemSettings = {
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

const defaultUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    nickname: '超级管理员',
    passwordHash: defaultAdminHash,
    salt: defaultAdminSalt,
    role: 'admin',
    vipTier: 'svip',
    vipTierName: 'SVIP 永久尊享',
    vipExpireAt: null, // Lifetime
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          users: parsed.users || defaultUsers,
          inviteCodes: parsed.inviteCodes || defaultInviteCodes,
          categories: parsed.categories || defaultCategories,
          sites: parsed.sites || defaultSites,
          ads: parsed.ads || defaultAds,
          sessions: parsed.sessions || {},
        };
      }
    } catch (e) {
      console.error('Failed to load database file, using defaults:', e);
    }

    const initial: DatabaseSchema = {
      settings: defaultSettings,
      users: defaultUsers,
      inviteCodes: defaultInviteCodes,
      categories: defaultCategories,
      sites: defaultSites,
      ads: defaultAds,
      sessions: {},
    };
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  updateSettings(partial: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
    return this.data.settings;
  }

  // --- Users & Sessions ---
  findUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  listUsers(): User[] {
    return [...this.data.users];
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  deleteUser(id: string): boolean {
    const len = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  createSession(userId: string): string {
    const token = generateToken();
    this.data.sessions[token] = { userId, createdAt: Date.now() };
    this.save();
    return token;
  }

  getSessionUser(token: string): User | undefined {
    if (!token) return undefined;
    const session = this.data.sessions[token];
    if (!session) return undefined;
    const user = this.findUserById(session.userId);
    if (!user || user.status === 'banned') return undefined;
    return user;
  }

  destroySession(token: string) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }

  // --- Invite Codes ---
  listInviteCodes(): InviteCode[] {
    return [...this.data.inviteCodes];
  }

  findInviteCode(codeStr: string): InviteCode | undefined {
    return this.data.inviteCodes.find(c => c.code.trim().toUpperCase() === codeStr.trim().toUpperCase());
  }

  createInviteCodes(newCodes: InviteCode[]): InviteCode[] {
    this.data.inviteCodes.unshift(...newCodes);
    this.save();
    return newCodes;
  }

  updateInviteCode(id: string, updates: Partial<InviteCode>): InviteCode | undefined {
    const idx = this.data.inviteCodes.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.inviteCodes[idx] = { ...this.data.inviteCodes[idx], ...updates };
    this.save();
    return this.data.inviteCodes[idx];
  }

  deleteInviteCode(id: string): boolean {
    const len = this.data.inviteCodes.length;
    this.data.inviteCodes = this.data.inviteCodes.filter(c => c.id !== id);
    if (this.data.inviteCodes.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Categories ---
  listCategories(): Category[] {
    return [...this.data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  createCategory(category: Category): Category {
    this.data.categories.push(category);
    this.save();
    return category;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | undefined {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.save();
    return this.data.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const len = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    if (this.data.categories.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Sites ---
  listSites(includePending = false): SiteItem[] {
    if (includePending) {
      return [...this.data.sites];
    }
    return this.data.sites.filter(s => s.status === 'approved');
  }

  findSiteById(id: string): SiteItem | undefined {
    return this.data.sites.find(s => s.id === id);
  }

  createSite(site: SiteItem): SiteItem {
    this.data.sites.unshift(site);
    this.save();
    return site;
  }

  updateSite(id: string, updates: Partial<SiteItem>): SiteItem | undefined {
    const idx = this.data.sites.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.sites[idx] = { ...this.data.sites[idx], ...updates };
    this.save();
    return this.data.sites[idx];
  }

  deleteSite(id: string): boolean {
    const len = this.data.sites.length;
    this.data.sites = this.data.sites.filter(s => s.id !== id);
    if (this.data.sites.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  incrementSiteClick(id: string): number {
    const site = this.data.sites.find(s => s.id === id);
    if (site) {
      site.clickCount = (site.clickCount || 0) + 1;
      this.save();
      return site.clickCount;
    }
    return 0;
  }

  // --- Ads ---
  listAds(onlyActive = true): AdItem[] {
    if (onlyActive) {
      return this.data.ads.filter(a => a.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return [...this.data.ads].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  createAd(ad: AdItem): AdItem {
    this.data.ads.push(ad);
    this.save();
    return ad;
  }

  updateAd(id: string, updates: Partial<AdItem>): AdItem | undefined {
    const idx = this.data.ads.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.data.ads[idx] = { ...this.data.ads[idx], ...updates };
    this.save();
    return this.data.ads[idx];
  }

  deleteAd(id: string): boolean {
    const len = this.data.ads.length;
    this.data.ads = this.data.ads.filter(a => a.id !== id);
    if (this.data.ads.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  incrementAdClick(id: string): number {
    const ad = this.data.ads.find(a => a.id === id);
    if (ad) {
      ad.clickCount = (ad.clickCount || 0) + 1;
      this.save();
      return ad.clickCount;
    }
    return 0;
  }

  resetToDemo(): void {
    this.data = {
      settings: defaultSettings,
      users: defaultUsers,
      inviteCodes: defaultInviteCodes,
      categories: defaultCategories,
      sites: defaultSites,
      ads: defaultAds,
      sessions: {},
    };
    this.save();
  }
}

export const db = new Database();
