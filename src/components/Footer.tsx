import React from 'react';
import { SystemSettings } from '../types';
import { Crown, Sparkles, ExternalLink } from 'lucide-react';

interface FooterProps {
  settings: SystemSettings | null;
  onOpenGatekeeper: () => void;
  onOpenSubmit: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenGatekeeper,
  onOpenSubmit,
}) => {
  const siteTitle = settings?.siteName || '极光VIP精选导航';
  const inviteUrl = settings?.invitePurchaseUrl || 'https://t.me/aurora_vip_nav';
  const inviteBtnText = settings?.invitePurchaseButtonText || '开通VIP卡密';
  const logoUrl = settings?.logoUrl;

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteTitle}
                  className="h-6 w-auto max-w-[120px] object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                </div>
              )}
              <span>{siteTitle}</span>
            </div>
            <p className="text-slate-500 max-w-md text-xs">
              {settings?.siteSlogan || '专为互联网专业人士甄选的高品质生产力导航平台'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 font-medium">
            <button
              onClick={onOpenSubmit}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              申请收录站点
            </button>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-700 transition-colors flex items-center gap-1 font-semibold text-amber-600"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{inviteBtnText}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onOpenGatekeeper}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              会员卡密激活
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved. 生产环境官方正式版
          </p>
          <div className="flex items-center gap-3">
            <span>商务联系: {settings?.contactEmail || 'admin@auroranav.com'}</span>
            <span>&bull;</span>
            <span>官方频道: {settings?.telegramGroup || '@aurora_vip_nav'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
