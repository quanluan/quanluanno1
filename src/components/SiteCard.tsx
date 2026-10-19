import React, { useState } from 'react';
import { SiteItem, User } from '../types';
import { api } from '../api';
import { ExternalLink, Lock, CheckCircle2, Copy, Flame, Crown } from 'lucide-react';

interface SiteCardProps {
  site: SiteItem;
  user: User | null;
  categoryName?: string;
  onGatekeeperTrigger: (site: SiteItem) => void;
  forceLogin: boolean;
}

export function formatTargetUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|MicroMessenger/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
};

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  user,
  categoryName,
  onGatekeeperTrigger,
  forceLogin,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAuthed = !!user;
  const isVip = isAuthed && (user.role === 'admin' || !user.vipExpireAt || user.vipExpireAt > Date.now());
  const isLocked = forceLogin && !isAuthed;
  const isVipRestricted = site.minVipTier !== 'all' && !isVip;
  const hasUrl = Boolean(site.url);
  const canAccess = !isLocked && !isVipRestricted && hasUrl;

  const formattedUrl = formatTargetUrl(site.url);
  const isMobile = isMobileDevice();

  // 手机端与桌面端自适应跳转优化：
  // 1. 移动端优先采用直接直达，彻底杜绝手机 Safari / 微信 / 移动端浏览器对弹窗与 target="_blank" 的屏蔽
  // 2. 移除 a 标签内嵌 button 的非法 HTML 结构，杜绝事件冒泡吞噬
  // 3. 若用户已登录但 URL 异步缓存未刷新，点击时实时通过 API 获取并即时跳转，杜绝无反应
  const handleCardClick = async (e: React.MouseEvent) => {
    // 若点击的是复制链接操作，不触发整卡跳转
    if ((e.target as HTMLElement).closest('[data-action="copy"]')) {
      return;
    }

    if (!canAccess) {
      e.preventDefault();
      // 用户已登录状态下，若仅是因为 site.url 临时为空，直接动态请求解锁接口直达
      if (isAuthed && (!isVipRestricted || isVip)) {
        try {
          const res = await api.clickSite(site.id);
          if (res?.url) {
            const dest = formatTargetUrl(res.url);
            if (isMobile) {
              window.location.href = dest;
            } else {
              window.open(dest, '_blank', 'noopener,noreferrer');
            }
            return;
          }
        } catch {
          // 若需更高VIP权限，进入VIP提示激活弹窗
        }
      }
      onGatekeeperTrigger(site);
      return;
    }

    // 后台静默自增点击统计
    api.clickSite(site.id).catch(() => {});

    // 手机端直接执行安全页面直达，防止部分移动端 WebKit 引擎对 a 标签在新标签页拦截
    if (isMobile && formattedUrl) {
      e.preventDefault();
      window.location.href = formattedUrl;
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAccess) {
      onGatekeeperTrigger(site);
      return;
    }
    const urlToCopy = formattedUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <a
      href={canAccess && formattedUrl ? formattedUrl : '#'}
      target={isMobile ? '_self' : '_blank'}
      rel="noopener noreferrer"
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-white no-underline text-inherit ${
        site.isPinned
          ? 'border-indigo-200 shadow-sm hover:border-indigo-400 hover:shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div>
        {/* 顶部图标 + 标题 + 置顶/VIP标识 */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
            {!imgError && site.iconUrl ? (
              <img
                src={site.iconUrl}
                alt={site.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {site.title.substring(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                {site.title}
              </h3>
              {site.isPinned && (
                <span className="shrink-0 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                  置顶
                </span>
              )}
              {site.minVipTier !== 'all' && (
                <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                  <Crown className="w-3 h-3" />
                  VIP
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
              {categoryName && <span>{categoryName}</span>}
              {categoryName && site.tags?.length > 0 && <span aria-hidden="true">&bull;</span>}
              {site.tags && site.tags.length > 0 && (
                <span>{site.tags.slice(0, 2).join(' / ')}</span>
              )}
            </div>
          </div>
        </div>

        {/* 站点简介 */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {site.description}
        </p>
      </div>

      {/* 底部直达栏 */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400 text-[11px] font-mono tabular-nums">
          <Flame className="w-3 h-3 text-slate-400" />
          <span>{site.clickCount} 次直达</span>
        </div>
        <div className="flex items-center gap-2">
          {!canAccess ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>登录直达</span>
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span
                role="button"
                tabIndex={0}
                data-action="copy"
                onClick={handleCopyLink}
                title="复制链接"
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                <span>直达访问</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
};
