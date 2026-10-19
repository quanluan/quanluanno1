import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { Crown, Sparkles, ShieldCheck, LogOut, PlusCircle, ExternalLink } from 'lucide-react';

interface HeaderProps {
  settings: SystemSettings | null;
  user: User | null;
  onOpenGatekeeper: (tab?: 'login' | 'register') => void;
  onOpenSubmit: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onSelectCategory: (catId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  user,
  onOpenGatekeeper,
  onOpenSubmit,
  onOpenAdmin,
  onLogout,
  onSelectCategory,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const siteTitle = settings?.siteName || '极光VIP精选导航';
  const inviteUrl = settings?.invitePurchaseUrl || 'https://t.me/aurora_vip_nav';
  const inviteBtnText = settings?.invitePurchaseButtonText || '开通VIP卡密';
  const logoUrl = settings?.logoUrl;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark / Custom Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectCategory('all');
            }}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap group"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteTitle}
                className="h-8 sm:h-9 w-auto max-w-[160px] object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <span className="font-semibold">{siteTitle}</span>
          </a>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectCategory('all')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            全部精选
          </button>
          <button
            onClick={() => onSelectCategory('cat-ai')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            AI 人工智能
          </button>
          <button
            onClick={() => onSelectCategory('cat-dev')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            开发技术
          </button>
          <button
            onClick={() => onSelectCategory('cat-design')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            设计灵感
          </button>
          <button
            onClick={() => onSelectCategory('cat-tools')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            效能工具
          </button>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors whitespace-nowrap font-semibold"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{inviteBtnText}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </nav>

        {/* Zone 3: Actions & User Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Submit site button */}
          <button
            onClick={onOpenSubmit}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>申请收录</span>
          </button>

          {/* User state */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                  {user.nickname?.substring(0, 1) || user.username.substring(0, 1).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium text-slate-800 truncate max-w-[100px]">
                    {user.nickname || user.username}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">
                    {user.vipTierName}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="font-medium text-slate-800 truncate">{user.nickname} (@{user.username})</p>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      {user.role === 'admin'
                        ? '超级管理员'
                        : user.vipExpireAt
                        ? `VIP到期: ${new Date(user.vipExpireAt).toLocaleDateString()}`
                        : '永久尊享会员'}
                    </p>
                  </div>
                  {user.role === 'admin' && (
                    <button
                      onClick={onOpenAdmin}
                      className="w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      <span>管理控制台</span>
                    </button>
                  )}
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>升级 / 续费VIP</span>
                  </a>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenGatekeeper('login')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                会员登录
              </button>
              <button
                onClick={() => onOpenGatekeeper('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>激活卡密</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
