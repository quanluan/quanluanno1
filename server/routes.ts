import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  db,
  User,
  InviteCode,
  SiteItem,
  Category,
  AdItem,
  verifyPassword,
  hashNewPassword,
} from './db';

const router = Router();

export interface AuthRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = db.getSessionUser(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录会员账户' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足，仅超级管理员可操作' });
  }
  next();
}

// User serializer (exclude password hash and salt)
function serializeUser(user: User) {
  const isExpired = user.vipExpireAt !== null && user.vipExpireAt < Date.now();
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    role: user.role,
    avatar: user.avatar,
    vipTier: isExpired && user.role !== 'admin' ? 'free' : user.vipTier,
    vipTierName: isExpired && user.role !== 'admin' ? '已到期' : user.vipTierName,
    vipExpireAt: user.vipExpireAt,
    isExpired: isExpired && user.role !== 'admin',
    isLifetime: user.vipExpireAt === null,
    createdAt: user.createdAt,
    status: user.status,
  };
}

// --- PUBLIC & SYSTEM ROUTES ---

// 1. Get system public settings
router.get('/system/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    installed: settings.installed,
    siteName: settings.siteName,
    siteSlogan: settings.siteSlogan,
    siteNotice: settings.siteNotice,
    showNotice: settings.showNotice,
    invitePurchaseUrl: settings.invitePurchaseUrl,
    invitePurchaseButtonText: settings.invitePurchaseButtonText,
    forceLoginToViewUrl: settings.forceLoginToViewUrl,
    allowPublicSubmission: settings.allowPublicSubmission,
    autoApproveSubmission: settings.autoApproveSubmission,
    defaultVipDays: settings.defaultVipDays,
    contactEmail: settings.contactEmail,
    telegramGroup: settings.telegramGroup,
    backgroundImageUrl: settings.backgroundImageUrl || '',
    logoUrl: settings.logoUrl || '',
  });
});

// 2. Initial Setup / Installation
router.post('/system/install', (req: Request, res: Response) => {
  const { siteName, siteSlogan, adminUsername, adminPassword, invitePurchaseUrl, backgroundImageUrl, logoUrl } = req.body;
  if (!adminUsername || !adminPassword) {
    return res.status(400).json({ error: '管理员用户名和密码不能为空' });
  }
  if (adminPassword.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  const { hash, salt } = hashNewPassword(adminPassword);
  const existingAdmin = db.findUserByUsername(adminUsername);
  if (existingAdmin) {
    db.updateUser(existingAdmin.id, {
      username: adminUsername,
      passwordHash: hash,
      salt,
      role: 'admin',
      vipTier: 'svip',
      vipTierName: '超级管理员',
      vipExpireAt: null,
      status: 'active',
    });
  } else {
    db.createUser({
      id: 'admin-' + Date.now(),
      username: adminUsername,
      nickname: '超级管理员',
      passwordHash: hash,
      salt,
      role: 'admin',
      vipTier: 'svip',
      vipTierName: '超级管理员',
      vipExpireAt: null,
      createdAt: new Date().toISOString(),
      status: 'active',
    });
  }

  db.updateSettings({
    installed: true,
    siteName: siteName || '极光VIP精选资源导航',
    siteSlogan: siteSlogan || '专为互联网专业人士甄选的生产力工具与技术枢纽',
    invitePurchaseUrl: invitePurchaseUrl || 'https://t.me/aurora_vip_nav',
    backgroundImageUrl: backgroundImageUrl || '',
    logoUrl: logoUrl || '',
  });

  res.json({ success: true, message: '配置已更新完成' });
});

// 3. User Register (Mandatory Invite Code)
router.post('/auth/register', (req: Request, res: Response) => {
  const { username, password, nickname, inviteCode } = req.body;
  if (!username || !password || !inviteCode) {
    return res.status(400).json({ error: '用户名、密码与卡密激活码均为必填项' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需在 3-20 位字符之间' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  const existingUser = db.findUserByUsername(username);
  if (existingUser) {
    return res.status(400).json({ error: '该用户名已被注册，请更换其它名称' });
  }

  // Verify Invite Code
  const codeRecord = db.findInviteCode(inviteCode);
  if (!codeRecord) {
    return res.status(400).json({ error: '无效的卡密激活码，请核验后重新输入' });
  }
  if (codeRecord.status === 'used') {
    return res.status(400).json({ error: '该卡密已被使用，请获取新的激活卡密' });
  }
  if (codeRecord.status === 'disabled') {
    return res.status(400).json({ error: '该卡密已被停用' });
  }

  // Calculate VIP expiry
  const now = Date.now();
  let vipExpireAt: number | null = null;
  if (codeRecord.vipDays >= 9999) {
    vipExpireAt = null; // Lifetime VIP
  } else {
    vipExpireAt = now + codeRecord.vipDays * 86400 * 1000;
  }

  const { hash, salt } = hashNewPassword(password);
  const userId = 'usr-' + crypto.randomUUID().substring(0, 8);
  const newUser: User = {
    id: userId,
    username: username.trim(),
    nickname: nickname?.trim() || username.trim(),
    passwordHash: hash,
    salt,
    role: 'user',
    vipTier: codeRecord.vipTier,
    vipTierName: codeRecord.vipTierName,
    vipExpireAt,
    inviteCodeUsed: codeRecord.code,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  db.createUser(newUser);

  // Mark invite code as used
  db.updateInviteCode(codeRecord.id, {
    status: 'used',
    usedByUserId: userId,
    usedByUsername: username.trim(),
    usedAt: new Date().toISOString(),
  });

  // Automatically log in
  const token = db.createSession(userId);

  res.json({
    success: true,
    message: `注册成功，已激活 ${codeRecord.vipTierName} 权限！`,
    token,
    user: serializeUser(newUser),
  });
});

// 4. User Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const user = db.findUserByUsername(username);
  if (!user) {
    return res.status(400).json({ error: '用户名或密码不正确' });
  }
  if (user.status === 'banned') {
    return res.status(403).json({ error: '此账号已被封禁，请联系客服' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(400).json({ error: '用户名或密码不正确' });
  }

  const token = db.createSession(user.id);
  res.json({
    success: true,
    message: '登录成功',
    token,
    user: serializeUser(user),
  });
});

// 5. Auth Me (Current Session)
router.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: serializeUser(req.user),
  });
});

// 6. User Logout
router.post('/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    db.destroySession(token);
  }
  res.json({ success: true, message: '已安全退出登录' });
});

// 7. Get Categories
router.get('/categories', (req: Request, res: Response) => {
  res.json(db.listCategories());
});

// 8. Get Public Sites (with gatekeeper URL obfuscation if unauthenticated)
router.get('/sites', authMiddleware, (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  const sites = db.listSites(false);
  const isAuthed = !!req.user;
  const isVip = isAuthed && (req.user?.role === 'admin' || !req.user?.vipExpireAt || req.user.vipExpireAt > Date.now());

  const sanitized = sites.map(site => {
    const isLocked = settings.forceLoginToViewUrl && !isAuthed;
    const isVipLocked = site.minVipTier !== 'all' && !isVip;
    return {
      id: site.id,
      title: site.title,
      description: site.description,
      categoryId: site.categoryId,
      iconUrl: site.iconUrl,
      tags: site.tags,
      isPinned: site.isPinned,
      isFeatured: site.isFeatured,
      minVipTier: site.minVipTier,
      clickCount: site.clickCount,
      createdAt: site.createdAt,
      url: isLocked || isVipLocked ? null : site.url,
      isLocked: isLocked || isVipLocked,
      lockReason: isLocked ? 'require_login' : isVipLocked ? 'require_vip' : null,
    };
  });
  res.json(sanitized);
});

// 9. Site Click & Reveal URL
router.post('/sites/click/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  const site = db.findSiteById(req.params.id);
  if (!site) {
    return res.status(404).json({ error: '目标站点未收录或已移除' });
  }

  // Check login requirement
  if (settings.forceLoginToViewUrl && !req.user) {
    return res.status(401).json({
      error: '请先登录以访问此收录站点',
      requireLogin: true,
      siteTitle: site.title,
    });
  }

  // Check VIP requirement if restricted
  if (site.minVipTier !== 'all') {
    const isVip = req.user && (req.user.role === 'admin' || !req.user.vipExpireAt || req.user.vipExpireAt > Date.now());
    if (!isVip) {
      return res.status(403).json({
        error: '该资源为VIP会员专属，请开通对应权限',
        requireVip: true,
      });
    }
  }

  db.incrementSiteClick(site.id);

  res.json({
    success: true,
    url: site.url,
    title: site.title,
  });
});

// 10. Submit custom website from front-end
router.post('/sites/submit', authMiddleware, (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  if (!settings.allowPublicSubmission && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({ error: '站点收录提交通道当前已关闭' });
  }

  const { title, url, description, categoryId, iconUrl, tags } = req.body;
  if (!title || !url || !categoryId) {
    return res.status(400).json({ error: '请完整填写网站名称、链接及分类' });
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const isAutoApproved = settings.autoApproveSubmission || req.user?.role === 'admin';
  const newSite: SiteItem = {
    id: 'site-' + crypto.randomUUID().substring(0, 8),
    title: title.trim(),
    url: formattedUrl,
    description: description?.trim() || '优质站点推荐',
    categoryId,
    iconUrl: iconUrl?.trim() || '',
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(/[, \s]+/).filter(Boolean) : [],
    isPinned: false,
    isFeatured: false,
    minVipTier: 'all',
    status: isAutoApproved ? 'approved' : 'pending',
    submitterId: req.user ? req.user.id : null,
    submitterName: req.user ? req.user.nickname || req.user.username : '匿名提交',
    clickCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.createSite(newSite);

  res.json({
    success: true,
    message: isAutoApproved ? '提交成功，已收录展示' : '提交成功，请等待管理员审核',
    site: newSite,
  });
});

// 11. Ads listing
router.get('/ads', (req: Request, res: Response) => {
  res.json(db.listAds(true));
});

// 12. Ad click tracker
router.post('/ads/click/:id', (req: Request, res: Response) => {
  db.incrementAdClick(req.params.id);
  res.json({ success: true });
});

// --- ADMIN MANAGEMENT ROUTES (requireAdmin) ---

// Admin Stats
router.get('/admin/stats', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.listUsers();
  const sites = db.listSites(true);
  const codes = db.listInviteCodes();
  const ads = db.listAds(false);

  const totalClicks = sites.reduce((sum, s) => sum + (s.clickCount || 0), 0);
  const now = Date.now();
  const activeVipUsers = users.filter(u => u.role === 'admin' || !u.vipExpireAt || u.vipExpireAt > now).length;
  const unusedCodes = codes.filter(c => c.status === 'unused').length;
  const pendingSites = sites.filter(s => s.status === 'pending').length;

  res.json({
    totalUsers: users.length,
    activeVipUsers,
    totalSites: sites.length,
    pendingSites,
    totalCodes: codes.length,
    unusedCodes,
    totalAds: ads.length,
    totalClicks,
  });
});

// Admin Sites CRUD
router.get('/admin/sites', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.listSites(true));
});

router.post('/admin/sites', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, url, description, categoryId, iconUrl, tags, isPinned, isFeatured, minVipTier, status } = req.body;
  if (!title || !url || !categoryId) {
    return res.status(400).json({ error: '标题、链接和分类为必填项' });
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const site: SiteItem = {
    id: 'site-' + crypto.randomUUID().substring(0, 8),
    title: title.trim(),
    url: formattedUrl,
    description: description?.trim() || '',
    categoryId,
    iconUrl: iconUrl?.trim() || '',
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(/[, \s]+/).filter(Boolean) : [],
    isPinned: Boolean(isPinned),
    isFeatured: Boolean(isFeatured),
    minVipTier: minVipTier || 'all',
    status: status || 'approved',
    submitterId: req.user!.id,
    submitterName: req.user!.nickname || req.user!.username,
    clickCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.createSite(site);
  res.json({ success: true, site });
});

router.put('/admin/sites/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateSite(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: '站点不存在' });
  res.json({ success: true, site: updated });
});

router.delete('/admin/sites/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteSite(req.params.id);
  res.json({ success: deleted });
});

// Admin Category CRUD
router.post('/admin/categories', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, icon, description, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: '分类名称不能为空' });

  const category: Category = {
    id: 'cat-' + Date.now(),
    name: name.trim(),
    icon: icon?.trim() || 'Folder',
    description: description?.trim() || '',
    sortOrder: Number(sortOrder) || db.listCategories().length + 1,
  };

  db.createCategory(category);
  res.json({ success: true, category });
});

router.put('/admin/categories/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: '分类不存在' });
  res.json({ success: true, category: updated });
});

router.delete('/admin/categories/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteCategory(req.params.id);
  res.json({ success: deleted });
});

// Admin Ads CRUD
router.get('/admin/ads', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.listAds(false));
});

router.post('/admin/ads', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, position, imageUrl, targetUrl, badgeText, description, isActive, sortOrder } = req.body;
  if (!title || !targetUrl) return res.status(400).json({ error: '广告标题与目标链接不能为空' });

  const ad: AdItem = {
    id: 'ad-' + Date.now(),
    title: title.trim(),
    position: position || 'grid_sponsor',
    imageUrl: imageUrl?.trim() || '',
    targetUrl: targetUrl.trim(),
    badgeText: badgeText?.trim() || '赞助',
    description: description?.trim() || '',
    isActive: isActive !== false,
    clickCount: 0,
    sortOrder: Number(sortOrder) || 1,
    createdAt: new Date().toISOString(),
  };

  db.createAd(ad);
  res.json({ success: true, ad });
});

router.put('/admin/ads/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateAd(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: '广告不存在' });
  res.json({ success: true, ad: updated });
});

router.delete('/admin/ads/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteAd(req.params.id);
  res.json({ success: deleted });
});

// Admin Invite Codes Management
router.get('/admin/invite-codes', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.listInviteCodes());
});

// Batch generate invite codes
router.post('/admin/invite-codes/generate', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const { count = 5, prefix = 'VIP', vipDays = 30, vipTier = 'vip', remark = '系统批量生成' } = req.body;
  const numCount = Math.min(Math.max(Number(count) || 1, 1), 100);

  const tierNames: { [key: string]: string } = {
    vip: vipDays >= 9999 ? 'VIP 永久会员' : `VIP 会员 (${vipDays}天)`,
    svip: vipDays >= 9999 ? 'SVIP 终身至尊' : `SVIP 至尊 (${vipDays}天)`,
  };

  const generated: InviteCode[] = [];
  for (let i = 0; i < numCount; i++) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const codeStr = `${prefix ? prefix.trim().toUpperCase() + '-' : ''}${randomHex}-${Math.floor(1000 + Math.random() * 9000)}`;
    generated.push({
      id: 'inv-' + crypto.randomUUID().substring(0, 8),
      code: codeStr,
      vipDays: Number(vipDays),
      vipTier: vipTier === 'svip' ? 'svip' : 'vip',
      vipTierName: tierNames[vipTier] || `VIP 会员 (${vipDays}天)`,
      status: 'unused',
      usedByUserId: null,
      usedByUsername: null,
      usedAt: null,
      createdAt: new Date().toISOString(),
      remark: remark || '后台管理生成',
    });
  }

  db.createInviteCodes(generated);
  res.json({ success: true, count: generated.length, codes: generated });
});

router.delete('/admin/invite-codes/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteInviteCode(req.params.id);
  res.json({ success: deleted });
});

router.put('/admin/invite-codes/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateInviteCode(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: '卡密不存在' });
  res.json({ success: true, code: updated });
});

// Admin User / Member Management
router.get('/admin/users', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.listUsers().map(serializeUser);
  res.json(users);
});

router.put('/admin/users/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const { nickname, role, vipTier, vipTierName, vipDaysToAdd, setLifetime, status, newPassword } = req.body;
  const user = db.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const updates: Partial<User> = {};
  if (nickname !== undefined) updates.nickname = nickname;
  if (role !== undefined) updates.role = role;
  if (vipTier !== undefined) updates.vipTier = vipTier;
  if (vipTierName !== undefined) updates.vipTierName = vipTierName;
  if (status !== undefined) updates.status = status;

  if (setLifetime === true) {
    updates.vipExpireAt = null;
  } else if (vipDaysToAdd !== undefined) {
    const currentExpire = user.vipExpireAt && user.vipExpireAt > Date.now() ? user.vipExpireAt : Date.now();
    updates.vipExpireAt = currentExpire + Number(vipDaysToAdd) * 86400 * 1000;
  }

  if (newPassword && newPassword.length >= 6) {
    const { hash, salt } = hashNewPassword(newPassword);
    updates.passwordHash = hash;
    updates.salt = salt;
  }

  const updated = db.updateUser(req.params.id, updates);
  res.json({ success: true, user: serializeUser(updated!) });
});

router.delete('/admin/users/:id', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: '不能删除当前登录的管理账号' });
  }
  const deleted = db.deleteUser(req.params.id);
  res.json({ success: deleted });
});

// Admin System Settings (including logoUrl)
router.get('/admin/settings', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.getSettings());
});

router.put('/admin/settings', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// Admin Reset Demo Data
router.post('/admin/reset', authMiddleware, requireAdmin, (req: AuthRequest, res: Response) => {
  db.resetToDemo();
  res.json({ success: true, message: '已重置为基础初始数据' });
});

export default router;
