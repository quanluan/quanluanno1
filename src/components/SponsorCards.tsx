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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded">
                    {ad.badgeText || '精选合作'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 mb-1">
                  {ad.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ad.description}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-amber-100/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>直达专区通道</span>
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
