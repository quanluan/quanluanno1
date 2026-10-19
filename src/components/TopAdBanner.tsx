import React from 'react';
import { AdItem } from '../types';
import { api } from '../api';
import { ExternalLink } from 'lucide-react';

interface TopAdBannerProps {
  ads: AdItem[];
}

export const TopAdBanner: React.FC<TopAdBannerProps> = ({ ads }) => {
  const topAd = ads.find((a) => a.position === 'top_banner');
  if (!topAd) return null;

  const handleClick = () => {
    api.clickAd(topAd.id);
  };

  const imageSrc = topAd.imageUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-4">
      <a
        href={topAd.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group relative block overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <div className="relative aspect-[21/9] sm:aspect-[24/6] w-full overflow-hidden flex items-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={topAd.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-800/40 via-sky-900/20 to-transparent" />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent flex items-center p-6 sm:p-10">
            <div className="max-w-2xl text-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-cyan-300 uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60">
                  {topAd.badgeText || '精选特约'}
                </span>
                <span className="text-xs text-slate-400">官方战略合作伙伴</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                {topAd.title}
              </h2>
              {topAd.description && (
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl leading-relaxed">
                  {topAd.description}
                </p>
              )}
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 group-hover:text-cyan-100 transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/15">
                  <span>直达特惠通道</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div className="absolute top-3 right-3 text-[10px] text-slate-400/80 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded font-mono">
            AD
          </div>
        </div>
      </a>
    </div>
  );
};
