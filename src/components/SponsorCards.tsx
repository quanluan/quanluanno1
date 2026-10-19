import React from 'react';
import { AdItem } from '../types';
import { api } from '../api';
import { ExternalLink, Sparkles } from 'lucide-react';

interface SponsorCardsProps {
  ads: AdItem[];
}

export const SponsorCards: React.FC<SponsorCardsProps> = ({ ads }) => {
  const gridAds = ads.filter((a) => a.position === 'grid_sponsor');
  if (gridAds.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">精选合作赞助推荐</h2>
          <span className="text-xs text-slate-400">官方认证合作展位</span>
        </div>
        <span className="text-[11px] text-slate-400">精选特约赞助</span>
      </div>

      {/* 合作展位：宽度与修改前展位宽度一致 (3列网格)，支持展示 GIF 动图与静态海报 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gridAds.map((ad) => {
          const handleClick = () => {
            api.clickAd(ad.id);
          };
          return (
            <a
              key={ad.id}
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="group relative flex flex-col justify-between p-4 rounded-xl border border-amber-200/70 bg-gradient-to-b from-amber-50/40 via-white to-white hover:border-amber-400 hover:shadow-md transition-all duration-200"
            >
              <div>
                {/* 支持展示 GIF 动图或静态海报图片 */}
                {ad.imageUrl && (
                  <div className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-slate-100 border border-amber-100/80 relative">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded truncate">
                    {ad.badgeText || '精选合作'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                </div>
                <h3 className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 mb-1">
                  {ad.title}
                </h3>
                {ad.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {ad.description}
                  </p>
                )}
              </div>
              <div className="mt-2.5 pt-2 border-t border-amber-100/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>直达专区</span>
                <span className="font-mono tabular-nums text-slate-500 group-hover:text-amber-600 transition-colors">
                  {ad.clickCount} 次直达
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
