import React, { useState, useEffect } from 'react';
import {
  User,
  Category,
  SiteItem,
  AdItem,
  InviteCode,
  SystemSettings,
  AdminStats,
} from '../types';
import { api } from '../api';
import {
  LayoutDashboard,
  KeyRound,
  Users,
  Globe,
  FolderTree,
  Megaphone,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Crown,
  RefreshCw,
  Search,
  X,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSettingsUpdated: () => void;
  onSitesUpdated: () => void;
}

type TabKey = 'overview' | 'codes' | 'users' | 'sites' | 'categories' | 'ads' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSettingsUpdated,
  onSitesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Data states
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Loading & alerts
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // --- Sub-Modals & Forms ---
  // 1. Batch Generate Invite Code Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(5);
  const [genPrefix, setGenPrefix] = useState('VIP');
  const [genDays, setGenDays] = useState(30);
  const [genTier, setGenTier] = useState<'vip' | 'svip'>('vip');
  const [genRemark, setGenRemark] = useState('管理员批量生成');

  // 2. Add/Edit Site Modal
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [siteForm, setSiteForm] = useState({
    title: '',
    url: '',
    categoryId: '',
    description: '',
    iconUrl: '',
    tags: '',
    isPinned: false,
    isFeatured: false,
    minVipTier: 'all' as 'all' | 'vip' | 'svip',
    status: 'approved' as 'approved' | 'pending' | 'rejected',
  });

  // 3. Add/Edit Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    icon: 'Folder',
    description: '',
    sortOrder: 1,
  });

  // 4. Add/Edit Ad Modal
  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [adForm, setAdForm] = useState({
    title: '',
    position: 'grid_sponsor' as 'top_banner' | 'grid_sponsor' | 'bottom_banner',
    imageUrl: '',
    targetUrl: '',
    badgeText: '精选赞助',
    description: '',
    isActive: true,
    sortOrder: 1,
  });

  // 5. Edit User VIP Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userVipDaysAdd, setUserVipDaysAdd] = useState(30);
  const [userVipTier, setUserVipTier] = useState<'free' | 'vip' | 'svip'>('vip');
  const [userSetLifetime, setUserSetLifetime] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  // Filters & searches
  const [codeFilter, setCodeFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [codeSearch, setCodeSearch] = useState('');
  const [siteSearch, setSiteSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Initial load
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sData, cData, uData, stData, catData, adData, settsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminInviteCodes(),
        api.getAdminUsers(),
        api.getAdminSites(),
        api.getCategories(),
        api.getAdminAds(),
        api.getAdminSettings(),
      ]);
      setStats(sData);
      setInviteCodes(cData);
      setUsers(uData);
      setSites(stData);
      setCategories(catData);
      setAds(adData);
      setSettings(settsData);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : '获取数据失败',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  if (!isOpen) return null;

  // --- Handlers: Invite Codes ---
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateInviteCodes({
        count: genCount,
        prefix: genPrefix,
        vipDays: genDays,
        vipTier: genTier,
        remark: genRemark,
      });
      showToast(`成功生成 ${res.count} 个激活卡密`);
      setShowGenModal(false);
      loadAllData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '生成失败', 'error');
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('确定要删除此卡密吗？')) return;
    try {
      await api.deleteAdminInviteCode(id);
      setInviteCodes(inviteCodes.filter((c) => c.id !== id));
      showToast('卡密已删除');
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const copyCode = async (code: InviteCode) => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopiedCodeId(code.id);
      setTimeout(() => setCopiedCodeId(null), 1500);
      showToast(`已复制卡密 ${code.code}`);
    } catch {
      // ignore
    }
  };

  const copyAllUnusedCodes = async () => {
    const unused = inviteCodes.filter((c) => c.status === 'unused').map((c) => `${c.code} (${c.vipTierName})`);
    if (unused.length === 0) {
      showToast('暂无可用的未激活卡密', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(unused.join('\n'));
      showToast(`已将 ${unused.length} 条未用卡密复制到剪贴板`);
    } catch {
      // ignore
    }
  };

  // --- Handlers: Sites ---
  const handleOpenAddSite = () => {
    setEditingSite(null);
    setSiteForm({
      title: '',
      url: '',
      categoryId: categories[0]?.id || '',
      description: '',
      iconUrl: '',
      tags: '',
      isPinned: false,
      isFeatured: false,
      minVipTier: 'all',
      status: 'approved',
    });
    setShowSiteModal(true);
  };

  const handleOpenEditSite = (site: SiteItem) => {
    setEditingSite(site);
    setSiteForm({
      title: site.title,
      url: site.url || '',
      categoryId: site.categoryId,
      description: site.description,
      iconUrl: site.iconUrl || '',
      tags: site.tags ? site.tags.join(' ') : '',
      isPinned: site.isPinned,
      isFeatured: site.isFeatured,
      minVipTier: site.minVipTier,
      status: site.status || 'approved',
    });
    setShowSiteModal(true);
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...siteForm,
        tags: siteForm.tags.split(/[, \s]+/).filter(Boolean),
      };
      if (editingSite) {
        await api.updateAdminSite(editingSite.id, payload);
        showToast('站点已更新');
      } else {
        await api.createAdminSite(payload);
        showToast('新站点已收录');
      }
      setShowSiteModal(false);
      loadAllData();
      onSitesUpdated();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '保存失败', 'error');
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!window.confirm('确定要移除此站点吗？')) return;
    try {
      await api.deleteAdminSite(id);
      setSites(sites.filter((s) => s.id !== id));
      showToast('站点已移除');
      onSitesUpdated();
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const handleApproveSite = async (site: SiteItem) => {
    try {
      await api.updateAdminSite(site.id, { status: 'approved' });
      showToast(`已通过审核: ${site.title}`);
      loadAllData();
      onSitesUpdated();
    } catch {
      showToast('操作失败', 'error');
    }
  };

  // --- Handlers: Categories ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateAdminCategory(editingCategory.id, catForm);
        showToast('分类已更新');
      } else {
        await api.createAdminCategory(catForm);
        showToast('分类已创建');
      }
      setShowCategoryModal(false);
      loadAllData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '保存失败', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('确定要删除此分类吗？关联站点可能受影响')) return;
    try {
      await api.deleteAdminCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      showToast('分类已删除');
    } catch {
      showToast('删除失败', 'error');
    }
  };

  // --- Handlers: Ads ---
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await api.updateAdminAd(editingAd.id, adForm);
        showToast('广告已更新');
      } else {
        await api.createAdminAd(adForm);
        showToast('新广告已上架');
      }
      setShowAdModal(false);
      loadAllData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '保存广告失败', 'error');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('确定要删除此赞助广告吗？')) return;
    try {
      await api.deleteAdminAd(id);
      setAds(ads.filter((a) => a.id !== id));
      showToast('广告已删除');
    } catch {
      showToast('删除失败', 'error');
    }
  };

  // --- Handlers: User & VIP ---
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserVipTier(user.vipTier);
    setUserRole(user.role);
    setUserSetLifetime(user.isLifetime);
    setUserVipDaysAdd(30);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const tierNames: Record<string, string> = {
        free: '普通用户',
        vip: 'VIP 会员',
        svip: 'SVIP 终身至尊',
      };
      await api.updateAdminUser(editingUser.id, {
        vipTier: userVipTier,
        vipTierName: tierNames[userVipTier] || 'VIP 会员',
        role: userRole,
        setLifetime: userSetLifetime,
        vipDaysToAdd: userSetLifetime ? undefined : userVipDaysAdd,
      });
      showToast('用户权限已成功更新');
      setShowUserModal(false);
      loadAllData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '更新用户失败', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) {
      showToast('不可删除当前登录的管理员账号', 'error');
      return;
    }
    if (!window.confirm('确定要删除该用户账号吗？')) return;
    try {
      await api.deleteAdminUser(id);
      setUsers(users.filter((u) => u.id !== id));
      showToast('用户已删除');
    } catch {
      showToast('删除失败', 'error');
    }
  };

  // --- Handlers: Settings ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateAdminSettings(settings);
      showToast('全局系统设置已成功保存');
      onSettingsUpdated();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '保存配置失败', 'error');
    }
  };

  // Filtered Invite Codes
  const filteredCodes = inviteCodes.filter((c) => {
    if (codeFilter !== 'all' && c.status !== codeFilter) return false;
    if (codeSearch && !c.code.toLowerCase().includes(codeSearch.toLowerCase())) return false;
    return true;
  });

  // Filtered Sites
  const filteredSites = sites.filter((s) => {
    if (siteSearch && !s.title.toLowerCase().includes(siteSearch.toLowerCase()) && !s.description.toLowerCase().includes(siteSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (userSearch && !u.username.toLowerCase().includes(userSearch.toLowerCase()) && !u.nickname?.toLowerCase().includes(userSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header of Admin Panel */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>网站管理后台控制台</span>
                <span className="text-[10px] font-normal text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  站长管理端
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                管理网站Logo、精选赞助广告、分类目录、卡密分发及会员权限
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={loading}
              title="刷新数据"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {msg && (
          <div
            className={`px-6 py-2 text-xs flex items-center justify-between shrink-0 ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-xs font-bold cursor-pointer">
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          {[
            { key: 'overview', label: '数据总览', icon: LayoutDashboard },
            { key: 'codes', label: '卡密激活码', icon: KeyRound, badge: stats?.unusedCodes },
            { key: 'users', label: '会员管理', icon: Users, badge: stats?.totalUsers },
            { key: 'sites', label: '收录目录管理', icon: Globe, badge: stats?.pendingSites ? `待审 ${stats.pendingSites}` : undefined },
            { key: 'categories', label: '分类导航', icon: FolderTree },
            { key: 'ads', label: '赞助广告展位', icon: Megaphone, badge: stats?.totalAds },
            { key: 'settings', label: '网站配置与Logo', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                      isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">已收录站点</span>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {stats?.totalSites || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    待审核提交: <span className="text-amber-600 font-semibold">{stats?.pendingSites || 0}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">注册会员总数</span>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1">
                    有效VIP会员: <span className="font-semibold">{stats?.activeVipUsers || 0}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">未激活卡密库存</span>
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
                    {stats?.unusedCodes || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    已累计生成: {stats?.totalCodes || 0} 张
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">全站直达点击量</span>
                  <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
                    {stats?.totalClicks || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">用户跳转访问统计</div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">快捷站长操作</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('codes');
                      setShowGenModal(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                    <span>批量生成VIP卡密</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('sites');
                      handleOpenAddSite();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>快速收录新站点</span>
                  </button>
                  <button
                    onClick={copyAllUnusedCodes}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <span>导出未用卡密 (一键复制)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>修改网站Logo与配置</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVITE CODES */}
          {activeTab === 'codes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGenModal(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>批量生成激活卡密</span>
                  </button>
                  <button
                    onClick={copyAllUnusedCodes}
                    className="px-3.5 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <span>一键导出可用卡密 ({inviteCodes.filter((c) => c.status === 'unused').length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                    <input
                      type="text"
                      placeholder="搜索卡密代码..."
                      value={codeSearch}
                      onChange={(e) => setCodeSearch(e.target.value)}
                      className="focus:outline-none w-32 sm:w-48 text-xs"
                    />
                  </div>
                  <select
                    value={codeFilter}
                    onChange={(e) => setCodeFilter(e.target.value as 'all' | 'unused' | 'used')}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="all">全部状态</option>
                    <option value="unused">仅未使用</option>
                    <option value="used">已被激活</option>
                  </select>
                </div>
              </div>

              {/* Table of invite codes */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">卡密激活码</th>
                      <th className="px-4 py-3">权益等级</th>
                      <th className="px-4 py-3">使用状态</th>
                      <th className="px-4 py-3">使用者</th>
                      <th className="px-4 py-3">激活时间</th>
                      <th className="px-4 py-3">备注说明</th>
                      <th className="px-4 py-3 text-right">管理操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCodes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          暂无符合条件的卡密
                        </td>
                      </tr>
                    ) : (
                      filteredCodes.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 tracking-wider">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {c.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-amber-700">{c.vipTierName}</span>
                          </td>
                          <td className="px-4 py-3">
                            {c.status === 'unused' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                待激活
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                已激活使用
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.usedByUsername ? `@${c.usedByUsername}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                            {c.usedAt ? new Date(c.usedAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{c.remark || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => copyCode(c)}
                                title="复制单条卡密"
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                              >
                                {copiedCodeId === c.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteCode(c.id)}
                                title="删除卡密"
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS & USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <input
                    type="text"
                    placeholder="搜索用户名或昵称..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="focus:outline-none w-full text-xs"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  共 {users.length} 名注册会员
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">会员用户</th>
                      <th className="px-4 py-3">角色权限</th>
                      <th className="px-4 py-3">VIP 等级</th>
                      <th className="px-4 py-3">有效期截止</th>
                      <th className="px-4 py-3">注册时间</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isVipActive = u.role === 'admin' || !u.vipExpireAt || u.vipExpireAt > Date.now();
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{u.nickname || u.username}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </td>
                          <td className="px-4 py-3">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                                <ShieldCheck className="w-3 h-3" />
                                管理员
                              </span>
                            ) : (
                              <span className="text-slate-600">普通会员</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>{u.vipTierName}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            {u.role === 'admin' || u.isLifetime ? (
                              <span className="text-emerald-700 font-semibold">永久有效</span>
                            ) : u.vipExpireAt ? (
                              isVipActive ? (
                                <span className="text-slate-700">
                                  {new Date(u.vipExpireAt).toLocaleDateString()} ({' '}
                                  {Math.ceil((u.vipExpireAt - Date.now()) / (86400 * 1000))} 天后到期)
                                </span>
                              ) : (
                                <span className="text-red-500 font-medium">已过期</span>
                              )
                            ) : (
                              <span className="text-slate-400">无有效会员</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                              >
                                调配 VIP/角色
                              </button>
                              {u.id !== currentUser.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SITES */}
          {activeTab === 'sites' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  onClick={handleOpenAddSite}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加精选站点</span>
                </button>
                <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <input
                    type="text"
                    placeholder="搜索收录站点..."
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    className="focus:outline-none w-full text-xs"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">站点名称与简介</th>
                      <th className="px-4 py-3">所属分类</th>
                      <th className="px-4 py-3">审核状态</th>
                      <th className="px-4 py-3">权限标记</th>
                      <th className="px-4 py-3">点击量</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSites.map((site) => {
                      const category = categories.find((c) => c.id === site.categoryId);
                      return (
                        <tr key={site.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {site.iconUrl && (
                                <img
                                  src={site.iconUrl}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-4 h-4 object-contain rounded shrink-0"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              )}
                              <span className="font-semibold text-slate-900">{site.title}</span>
                              <a
                                href={site.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-indigo-600"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                              {site.description}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{category?.name || '未分类'}</td>
                          <td className="px-4 py-3">
                            {site.status === 'approved' ? (
                              <span className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                                已收录发布
                              </span>
                            ) : site.status === 'pending' ? (
                              <span className="text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded">
                                待审核
                              </span>
                            ) : (
                              <span className="text-red-700 font-medium text-[11px] bg-red-50 px-2 py-0.5 rounded">
                                已拒绝
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {site.isPinned && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                  置顶
                                </span>
                              )}
                              {site.minVipTier !== 'all' ? (
                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                  VIP专属
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">公开</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-slate-600">
                            {site.clickCount || 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {site.status === 'pending' && (
                                <button
                                  onClick={() => handleApproveSite(site)}
                                  className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer"
                                >
                                  快速通过
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditSite(site)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSite(site.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatForm({ name: '', icon: 'Folder', description: '', sortOrder: categories.length + 1 });
                  setShowCategoryModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建分类目录</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const count = sites.filter((s) => s.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate-900">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            排序: {cat.sortOrder}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{cat.description || '暂无描述'}</p>
                        <span className="text-[11px] text-indigo-600 font-medium font-mono tabular-nums">
                          {count} 个站点
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatForm({
                              name: cat.name,
                              icon: cat.icon,
                              description: cat.description,
                              sortOrder: cat.sortOrder,
                            });
                            setShowCategoryModal(true);
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: ADS */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEditingAd(null);
                  setAdForm({
                    title: '',
                    position: 'grid_sponsor',
                    imageUrl: '',
                    targetUrl: '',
                    badgeText: '精选赞助',
                    description: '',
                    isActive: true,
                    sortOrder: 1,
                  });
                  setShowAdModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建赞助广告</span>
              </button>

              {/* 赞助广告展位管理：宽度与修改前展位宽度一致 (3列网格)，每条高度设为五分之一 (高度紧凑水平条状，支持GIF动图) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2.5 hover:border-slate-300 transition-colors min-h-[54px]"
                  >
                    {/* 左侧：广告图片 / GIF 动态图微缩预览 (支持 GIF 动图展示) */}
                    <div className="w-14 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 relative shrink-0 flex items-center justify-center">
                      {ad.imageUrl ? (
                        <>
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {ad.imageUrl.toLowerCase().includes('.gif') && (
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/75 px-1 py-0.2 rounded leading-none backdrop-blur-xs">
                              GIF
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">无图</span>
                      )}
                    </div>

                    {/* 中间：标题、展位类型、状态、链接 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-bold text-xs text-slate-900 truncate" title={ad.title}>
                          {ad.title}
                        </h4>
                        <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 px-1 py-0.2 rounded shrink-0">
                          {ad.position === 'top_banner' ? '顶部Banner' : '精选展位'}
                        </span>
                        <span className={`text-[9px] shrink-0 ${ad.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {ad.isActive ? '展示中' : '暂停'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={ad.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-600 hover:underline truncate block max-w-[170px]"
                          title={ad.targetUrl}
                        >
                          {ad.targetUrl}
                        </a>
                      </div>
                    </div>

                    {/* 右侧：点击量统计与编辑/删除操作按钮 */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-100">
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 hidden sm:inline" title="累计点击量">
                        {ad.clickCount}次
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setEditingAd(ad);
                            setAdForm({
                              title: ad.title,
                              position: ad.position,
                              imageUrl: ad.imageUrl,
                              targetUrl: ad.targetUrl,
                              badgeText: ad.badgeText,
                              description: ad.description,
                              isActive: ad.isActive,
                              sortOrder: ad.sortOrder,
                            });
                            setShowAdModal(true);
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                          title="编辑广告"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                          title="删除广告"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & LOGO */}
          {activeTab === 'settings' && settings && (
            <form onSubmit={handleSaveSettings} className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>网站品牌配置与Logo更换</span>
              </h3>

              {/* 1. Custom Brand Logo Settings */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>网站自定义 Logo</span>
                  </label>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: '' })}
                      className="text-red-600 hover:underline text-[11px] cursor-pointer"
                    >
                      恢复默认图标
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  填写 Logo 图片链接 (支持外链图片、SVG 图标或自有 CDN 链接)。留空时系统将自动采用默认炫彩极光微标。
                </p>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="例如: https://example.com/logo.png 或 /assets/logo.svg"
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs bg-white"
                  />
                </div>

                {/* Logo Live Preview */}
                <div className="pt-2 border-t border-indigo-100/80 flex items-center gap-4">
                  <span className="text-[11px] text-slate-500 shrink-0">实时效果预览:</span>
                  <div className="h-10 px-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2 shadow-2xs">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo Preview"
                        className="h-7 w-auto max-w-[140px] object-contain rounded"
                        onError={() => showToast('无法加载该 Logo 图片，请检查链接有效性', 'error')}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="font-bold text-slate-900 text-xs">{settings.siteName || '极光VIP导航'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Site Name & Slogan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">网站主标题 (Site Name)</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">网站副标题 (Slogan)</label>
                  <input
                    type="text"
                    value={settings.siteSlogan}
                    onChange={(e) => setSettings({ ...settings, siteSlogan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 3. VIP Purchase Link */}
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                <span className="font-bold text-amber-950 block">卡密购买与充值跳转渠道</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      购卡链接 (Telegram频道 / 发卡网 / 微信客服)
                    </label>
                    <input
                      type="text"
                      value={settings.invitePurchaseUrl}
                      onChange={(e) => setSettings({ ...settings, invitePurchaseUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">购卡按钮文字</label>
                    <input
                      type="text"
                      value={settings.invitePurchaseButtonText}
                      onChange={(e) => setSettings({ ...settings, invitePurchaseButtonText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Background image */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">全站背景大图 (可选)</label>
                  {settings.backgroundImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, backgroundImageUrl: '' })}
                      className="text-red-600 hover:underline text-[11px] cursor-pointer"
                    >
                      清除背景图
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://.../bg.jpg (留空则使用默认极简质感灰色)"
                  value={settings.backgroundImageUrl || ''}
                  onChange={(e) => setSettings({ ...settings, backgroundImageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] bg-white"
                />
              </div>

              {/* 5. Notice */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">顶部滚动公告</label>
                <input
                  type="text"
                  value={settings.siteNotice}
                  onChange={(e) => setSettings({ ...settings, siteNotice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 6. Contact and Telegram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">客服联系邮箱</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">官方客服 Telegram 群组/账号</label>
                  <input
                    type="text"
                    value={settings.telegramGroup}
                    onChange={(e) => setSettings({ ...settings, telegramGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 7. Permissions and Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showNotice}
                    onChange={(e) => setSettings({ ...settings, showNotice: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>开启顶部公告横条展示</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.forceLoginToViewUrl}
                    onChange={(e) => setSettings({ ...settings, forceLoginToViewUrl: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-900">
                    开启会员防护门（访客需登录或激活卡密才可直达目标网址）
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowPublicSubmission}
                    onChange={(e) => setSettings({ ...settings, allowPublicSubmission: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>允许前台访客提交收录申请</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  保存并应用所有设置
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* --- SUB-MODAL 1: BATCH GENERATE CODES --- */}
      {showGenModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>批量生成 VIP 激活卡密</span>
              </h3>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBatchGenerate} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">生成数量 (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">卡密前缀</label>
                  <input
                    type="text"
                    value={genPrefix}
                    onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                    placeholder="例如: VIP / 2026"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">VIP 会员等级</label>
                <select
                  value={genTier}
                  onChange={(e) => setGenTier(e.target.value as 'vip' | 'svip')}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="vip">VIP 会员</option>
                  <option value="svip">SVIP 至尊终身会员</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">有效时长</label>
                <select
                  value={genDays}
                  onChange={(e) => setGenDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={7}>7 天体验</option>
                  <option value={30}>30 天月卡</option>
                  <option value={90}>90 天季卡</option>
                  <option value={365}>365 天年卡</option>
                  <option value={9999}>永久有效 (Lifetime)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">批次备注说明</label>
                <input
                  type="text"
                  value={genRemark}
                  onChange={(e) => setGenRemark(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  立即生成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 2: ADD/EDIT SITE --- */}
      {showSiteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">
                {editingSite ? '编辑收录站点' : '收录新站点'}
              </h3>
              <button onClick={() => setShowSiteModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSite} className="p-5 space-y-3 overflow-y-auto">
              <div>
                <label className="block font-medium text-slate-700 mb-1">站点名称 *</label>
                <input
                  type="text"
                  value={siteForm.title}
                  onChange={(e) => setSiteForm({ ...siteForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">站点链接 (URL) *</label>
                <input
                  type="url"
                  value={siteForm.url}
                  onChange={(e) => setSiteForm({ ...siteForm, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">所属分类 *</label>
                  <select
                    value={siteForm.categoryId}
                    onChange={(e) => setSiteForm({ ...siteForm, categoryId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">访问权限</label>
                  <select
                    value={siteForm.minVipTier}
                    onChange={(e) => setSiteForm({ ...siteForm, minVipTier: e.target.value as 'all' | 'vip' | 'svip' })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">全员公开</option>
                    <option value="vip">VIP会员专属</option>
                    <option value="svip">SVIP专属</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">图标 URL</label>
                <input
                  type="url"
                  value={siteForm.iconUrl}
                  onChange={(e) => setSiteForm({ ...siteForm, iconUrl: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">站点描述</label>
                <textarea
                  rows={2}
                  value={siteForm.description}
                  onChange={(e) => setSiteForm({ ...siteForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">标签 (空格分隔)</label>
                <input
                  type="text"
                  value={siteForm.tags}
                  onChange={(e) => setSiteForm({ ...siteForm, tags: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={siteForm.isPinned}
                    onChange={(e) => setSiteForm({ ...siteForm, isPinned: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>置顶推荐</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={siteForm.isFeatured}
                    onChange={(e) => setSiteForm({ ...siteForm, isFeatured: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>首页特别推荐</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSiteModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  保存站点
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 3: ADD/EDIT CATEGORY --- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">
                {editingCategory ? '编辑分类' : '新建分类'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-4 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">分类名称 *</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">展示排序 (数值越小越靠前)</label>
                <input
                  type="number"
                  value={catForm.sortOrder}
                  onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">分类描述</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  保存分类
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 4: ADD/EDIT AD --- */}
      {showAdModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">
                {editingAd ? '编辑赞助广告' : '新建赞助广告'}
              </h3>
              <button onClick={() => setShowAdModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAd} className="p-4 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">广告标题 *</label>
                <input
                  type="text"
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">目标链接 URL *</label>
                <input
                  type="url"
                  value={adForm.targetUrl}
                  onChange={(e) => setAdForm({ ...adForm, targetUrl: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">展位位置</label>
                  <select
                    value={adForm.position}
                    onChange={(e) => setAdForm({ ...adForm, position: e.target.value as 'top_banner' | 'grid_sponsor' | 'bottom_banner' })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="top_banner">首页顶部大图 (Top Banner)</option>
                    <option value="grid_sponsor">精选合作赞助卡片 (Grid Sponsor)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">角标文本 (如 赞助/特惠)</label>
                  <input
                    type="text"
                    value={adForm.badgeText}
                    onChange={(e) => setAdForm({ ...adForm, badgeText: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  广告图片 / GIF 动态图 URL (支持静态海报或 GIF 动图)
                </label>
                <input
                  type="text"
                  value={adForm.imageUrl}
                  onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                  placeholder="https://... 或 GIF 动态图链接"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {adForm.imageUrl && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
                      <span>海报 / 动图预览:</span>
                      {adForm.imageUrl.toLowerCase().includes('.gif') && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          GIF 动态图
                        </span>
                      )}
                    </div>
                    <div className="aspect-[16/9] max-h-28 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        src={adForm.imageUrl}
                        alt="GIF 动图预览"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">广告宣传文案</label>
                <textarea
                  rows={2}
                  value={adForm.description}
                  onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adActive"
                  checked={adForm.isActive}
                  onChange={(e) => setAdForm({ ...adForm, isActive: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="adActive" className="text-slate-700 cursor-pointer">
                  上架启用该广告
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  保存广告
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 5: USER VIP SETTING --- */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>调配会员权益: @{editingUser.username}</span>
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-4 space-y-3.5">
              <div>
                <label className="block font-medium text-slate-700 mb-1">VIP 会员等级</label>
                <select
                  value={userVipTier}
                  onChange={(e) => setUserVipTier(e.target.value as 'free' | 'vip' | 'svip')}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="free">普通用户 (无VIP)</option>
                  <option value="vip">VIP 会员</option>
                  <option value="svip">SVIP 终身至尊</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">系统管理角色</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="user">普通会员用户</option>
                  <option value="admin">超级管理员 (拥有后台权限)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userSetLifetime}
                    onChange={(e) => setUserSetLifetime(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-950">直接设为终身永久有效 (无过期限制)</span>
                </label>

                {!userSetLifetime && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      增加有效天数 (当前有效期基础上累加)
                    </label>
                    <div className="flex gap-2">
                      {[7, 30, 90, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setUserVipDaysAdd(d)}
                          className={`px-3 py-1 rounded text-xs border cursor-pointer ${
                            userVipDaysAdd === d
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          +{d}天
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  确认调整
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
