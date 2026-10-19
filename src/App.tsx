import React, { useState, useEffect } from 'react';
import { User, Category, SiteItem, AdItem, SystemSettings } from './types';
import { api, setStoredToken } from './api';
import { Header } from './components/Header';
import { NoticeBanner } from './components/NoticeBanner';
import { TopAdBanner } from './components/TopAdBanner';
import { SponsorCards } from './components/SponsorCards';
import { SiteCard } from './components/SiteCard';
import { GatekeeperModal } from './components/GatekeeperModal';
import { SubmitSiteModal } from './components/SubmitSiteModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import {
  Search,
  Sparkles,
  Crown,
  KeyRound,
  ExternalLink,
  PlusCircle,
  FolderTree,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function App() {
  // System & user states
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [gatekeeperTab, setGatekeeperTab] = useState<'login' | 'register'>('register');
  const [targetSite, setTargetSite] = useState<SiteItem | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Initial load
  const loadInitialData = async () => {
    try {
      try {
        const me = await api.getMe();
        if (me.authenticated && me.user) {
          setCurrentUser(me.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }

      const [sets, cats, sts, adList] = await Promise.all([
        api.getSettings(),
        api.getCategories(),
        api.getSites(),
        api.getAds(),
      ]);
      setSettings(sets);
      setCategories(cats);
      setSites(sts);
      setAds(adList);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setCurrentUser(null);
    const sts = await api.getSites();
    setSites(sts);
  };

  const handleGatekeeperTrigger = (site?: SiteItem) => {
    setTargetSite(site || null);
    setGatekeeperTab('register');
    setShowGatekeeper(true);
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    const sts = await api.getSites();
    setSites(sts);
  };

  // Filter sites
  const filteredSites = sites.filter((site) => {
    if (selectedCategory !== 'all' && site.categoryId !== selectedCategory) {
      return false;
    }
    if (selectedTag && (!site.tags || !site.tags.includes(selectedTag))) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = site.title.toLowerCase().includes(q);
      const matchDesc = site.description.toLowerCase().includes(q);
      const matchTags = site.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const hasBgImage = Boolean(settings?.backgroundImageUrl);
  const inviteUrl = settings?.invitePurchaseUrl || 'https://t.me/aurora_vip_nav';
  const inviteBtnText = settings?.invitePurchaseButtonText || '开通VIP卡密';
  const forceLogin = settings?.forceLoginToViewUrl !== false;

  return (
    <div
      style={
        hasBgImage
          ? {
              backgroundImage: `url(${settings?.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
      className={`min-h-screen text-slate-800 flex flex-col font-sans transition-all duration-300 ${
        hasBgImage ? 'bg-slate-950/20 backdrop-blur-[2px]' : 'bg-slate-50/60'
      }`}
    >
      {/* 1. Global Notice Bar */}
      <NoticeBanner
        notice={settings?.siteNotice || ''}
        show={settings?.showNotice !== false}
        inviteUrl={inviteUrl}
        inviteBtnText={inviteBtnText}
      />

      {/* 2. Top Bar Navigation */}
      <Header
        settings={settings}
        user={currentUser}
        onOpenGatekeeper={(tab) => {
          setTargetSite(null);
          setGatekeeperTab(tab || 'register');
          setShowGatekeeper(true);
        }}
        onOpenSubmit={() => setShowSubmitModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onLogout={handleLogout}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedTag(null);
        }}
      />

      {/* 3. 首页 Banner 大图 */}
      <TopAdBanner ads={ads} />

      {/* 4. 精选合作赞助广告 (紧挨在首页Banner大图下面) */}
      <SponsorCards ads={ads} />

      {/* 5. 核心交互区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        {/* 标题与搜索框区 */}
        <section className="pt-2 pb-6 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-xs font-semibold text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>精选高价值站点 & VIP 专属收录</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto">
            {settings?.siteName || '极光VIP精选资源导航'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {settings?.siteSlogan || '专为互联网专业人士甄选的生产力工具与技术枢纽'}
          </p>

          {/* 搜索框 */}
          <div className="max-w-2xl mx-auto pt-1">
            <div className="relative flex items-center shadow-xs rounded-xl bg-white border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="搜索已收录站点、技术框架、AI工具或关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 text-sm focus:outline-none bg-transparent placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mr-3 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  清空
                </button>
              )}
            </div>

            {/* 快速操作与直达通道 */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3.5 text-xs">
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-100" />
                <span>{inviteBtnText}</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>申请收录</span>
              </button>

              {!currentUser && (
                <button
                  onClick={() => handleGatekeeperTrigger()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>卡密激活 / 登录</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 6. 精选收录目录 (紧挨在搜索框下面，无缝衔接) */}
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">精选收录目录</h2>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                ({filteredSites.length} 个站点)
              </span>
            </div>

            {/* 当前会员状态 */}
            <div className="text-xs">
              {currentUser ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>身份: {currentUser.vipTierName} (直达畅通)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>访客模式 (部分直达需登录)</span>
                </span>
              )}
            </div>
          </div>

          {/* 分类快捷导航栏 */}
          <div className="flex items-center gap-1.5 py-3 overflow-x-auto">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTag(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              全部目录 ({sites.length})
            </button>
            {categories.map((cat) => {
              const catCount = sites.filter((s) => s.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedTag(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-mono tabular-nums ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({catCount})
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 7. 精选收录站点列表 */}
        <section className="pb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse p-4" />
              ))}
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">未找到匹配的收录站点</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                换一个搜索关键词，或申请将您的网站收录进精选目录
              </p>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
              >
                立即申请收录
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSites.map((site) => {
                const category = categories.find((c) => c.id === site.categoryId);
                return (
                  <SiteCard
                    key={site.id}
                    site={site}
                    user={currentUser}
                    categoryName={category?.name}
                    onGatekeeperTrigger={handleGatekeeperTrigger}
                    forceLogin={forceLogin}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 8. 模态框组 */}
      {/* 门禁模态框: 登录与卡密激活 */}
      <GatekeeperModal
        isOpen={showGatekeeper}
        onClose={() => setShowGatekeeper(false)}
        targetSite={targetSite}
        settings={settings}
        initialTab={gatekeeperTab}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 提交新站点收录 */}
      <SubmitSiteModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        categories={categories}
        onSubmitted={() => {
          loadInitialData();
        }}
      />

      {/* 管理员控制台 (仅管理员登录可见触发) */}
      {currentUser && currentUser.role === 'admin' && (
        <AdminPanel
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          currentUser={currentUser}
          onSettingsUpdated={loadInitialData}
          onSitesUpdated={loadInitialData}
        />
      )}

      {/* 9. 生产环境官方页脚 */}
      <Footer
        settings={settings}
        onOpenGatekeeper={() => handleGatekeeperTrigger()}
        onOpenSubmit={() => setShowSubmitModal(true)}
      />
    </div>
  );
}
