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

  const handleCardClick = async (e: React.MouseEvent) => {
    if (isLocked || isVipRestricted) {
      e.preventDefault();
      onGatekeeperTrigger(site);
      return;
    }
    try {
      const res = await api.clickSite(site.id);
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else if (site.url) {
        window.open(site.url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      if (site.url) {
        window.open(site.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked || isVipRestricted) {
      onGatekeeperTrigger(site);
      return;
    }
    const urlToCopy = site.url || window.location.href;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-white ${
        site.isPinned
          ? 'border-indigo-200 shadow-sm hover:border-indigo-400 hover:shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div>
        {/* Top line: Icon + Title + Status indicator */}
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

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {site.description}
        </p>
      </div>

      {/* Bottom Bar: Lock Status or Direct Jump */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400 text-[11px] font-mono tabular-nums">
          <Flame className="w-3 h-3 text-slate-400" />
          <span>{site.clickCount} 次直达</span>
        </div>
        <div className="flex items-center gap-2">
          {isLocked || isVipRestricted ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>登录直达</span>
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyLink}
                title="复制链接"
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                <span>直达访问</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
