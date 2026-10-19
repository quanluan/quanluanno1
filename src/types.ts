export interface User {
  id: string;
  username: string;
  nickname: string;
  role: 'admin' | 'user';
  avatar?: string;
  vipTier: 'free' | 'vip' | 'svip';
  vipTierName: string;
  vipExpireAt: number | null; // ms timestamp or null for lifetime
  isExpired: boolean;
  isLifetime: boolean;
  createdAt: string;
  status: 'active' | 'banned';
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
  url: string | null;
  description: string;
  categoryId: string;
  iconUrl?: string;
  tags: string[];
  isPinned: boolean;
  isFeatured: boolean;
  minVipTier: 'all' | 'vip' | 'svip';
  clickCount: number;
  createdAt: string;
  isLocked?: boolean;
  lockReason?: 'require_login' | 'require_vip' | null;
  status?: 'approved' | 'pending' | 'rejected';
  submitterName?: string | null;
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

export interface InviteCode {
  id: string;
  code: string;
  vipDays: number;
  vipTier: 'vip' | 'svip';
  vipTierName: string;
  status: 'unused' | 'used' | 'disabled';
  usedByUserId: string | null;
  usedByUsername: string | null;
  usedAt: string | null;
  createdAt: string;
  remark: string;
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
  backgroundImageUrl?: string;
  logoUrl?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeVipUsers: number;
  totalSites: number;
  pendingSites: number;
  totalCodes: number;
  unusedCodes: number;
  totalAds: number;
  totalClicks: number;
}
