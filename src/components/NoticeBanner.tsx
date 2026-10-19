import React from 'react';
import { Megaphone, ExternalLink } from 'lucide-react';

interface NoticeBannerProps {
  notice: string;
  show: boolean;
  inviteUrl: string;
  inviteBtnText: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  notice,
  show,
  inviteUrl,
  inviteBtnText,
}) => {
  if (!show || !notice) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border-b border-indigo-100/80 text-xs text-indigo-950 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-indigo-700">
            <Megaphone className="w-3.5 h-3.5" />
            <span>站内公告</span>
          </span>
          <span className="text-slate-700 truncate">{notice}</span>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>{inviteBtnText}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
