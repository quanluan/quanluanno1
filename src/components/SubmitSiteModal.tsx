import React, { useState } from 'react';
import { Category, SiteItem } from '../types';
import { api } from '../api';
import { X, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface SubmitSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmitted: (newSite: SiteItem) => void;
}

export const SubmitSiteModal: React.FC<SubmitSiteModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [iconUrl, setIconUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || !url.trim() || !categoryId) {
      setErrorMsg('请填写网站名称、链接及分类');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitSite({
        title: title.trim(),
        url: url.trim(),
        categoryId,
        iconUrl: iconUrl.trim() || undefined,
        description: description.trim() || '优质站点推荐',
        tags: tags ? tags.split(/[, \s]+/).filter(Boolean) : [],
      });
      setSuccessMsg(res.message);
      onSubmitted(res.site);
      setTimeout(() => {
        onClose();
        setTitle('');
        setUrl('');
        setIconUrl('');
        setDescription('');
        setTags('');
        setSuccessMsg('');
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">申请网站收录</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              网站名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例如: GitHub / OpenAI / 极客导航"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              网站地址 (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                分类目录 <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
              <label className="block font-medium text-slate-700 mb-1">
                站点图标 (Favicon)
              </label>
              <input
                type="url"
                placeholder="https://.../favicon.ico"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              网站简短介绍
            </label>
            <textarea
              rows={2}
              placeholder="描述网站的主要特色和适用人群..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              关键词标签 (空格分隔)
            </label>
            <input
              type="text"
              placeholder="例如: AI 开发 工具"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{loading ? '提交中...' : '确认提交'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
