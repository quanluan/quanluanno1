import React, { useState } from 'react';
import { User, SystemSettings, SiteItem } from '../types';
import { api, setStoredToken } from '../api';
import { X, Lock, Crown, KeyRound, ExternalLink, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface GatekeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSite: SiteItem | null;
  settings: SystemSettings | null;
  initialTab?: 'login' | 'register';
  onLoginSuccess: (user: User) => void;
}

export const GatekeeperModal: React.FC<GatekeeperModalProps> = ({
  isOpen,
  onClose,
  targetSite,
  settings,
  initialTab = 'register',
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Register Form
  const [regUsername, setRegUsername] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');

  // Login Form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const inviteUrl = settings?.invitePurchaseUrl || 'https://t.me/aurora_vip_nav';
  const inviteBtnText = settings?.invitePurchaseButtonText || '开通VIP卡密';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regUsername.trim()) {
      setErrorMsg('请输入会员登录用户名');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('密码长度不能少于6位字符');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('两次输入的密码不一致，请重新检查');
      return;
    }
    if (!regInviteCode.trim()) {
      setErrorMsg('请输入有效的VIP卡密激活码');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        username: regUsername.trim(),
        nickname: regNickname.trim() || undefined,
        password: regPassword,
        inviteCode: regInviteCode.trim(),
      });
      setStoredToken(res.token);
      setSuccessMsg(res.message || '注册成功，正在跳转...');
      setTimeout(async () => {
        onLoginSuccess(res.user);
        onClose();
        if (targetSite) {
          try {
            const clickRes = await api.clickSite(targetSite.id);
            if (clickRes?.url) {
              const jump = clickRes.url.startsWith('http') ? clickRes.url : `https://${clickRes.url}`;
              window.location.href = jump;
              return;
            }
          } catch {
            // fallback
          }
        }
      }, 600);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '注册失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginUsername.trim() || !loginPassword) {
      setErrorMsg('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({
        username: loginUsername.trim(),
        password: loginPassword,
      });
      setStoredToken(res.token);
      setSuccessMsg('登录成功，正在进入...');
      setTimeout(async () => {
        onLoginSuccess(res.user);
        onClose();
        if (targetSite) {
          try {
            const clickRes = await api.clickSite(targetSite.id);
            if (clickRes?.url) {
              const jump = clickRes.url.startsWith('http') ? clickRes.url : `https://${clickRes.url}`;
              window.location.href = jump;
              return;
            }
          } catch {
            // fallback
          }
        }
      }, 600);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '登录失败，请核对信息');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header modal banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded">
              <Crown className="w-3.5 h-3.5" />
              VIP 专享权限通道
            </span>
            <span className="text-xs text-slate-400">会员验证</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>
              {targetSite ? `解锁访问 ${targetSite.title}` : '登录或激活会员身份'}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            本站收录资源面向注册会员及VIP开放，通过卡密激活享受全部极速直达服务。
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>卡密激活注册 (开通VIP)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>已有会员登录</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Mandatory Invite Code Section */}
              <div className="p-3.5 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/70 to-orange-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    <span>VIP 激活卡密 (邀请码)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline flex items-center gap-1"
                  >
                    <span>{inviteBtnText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="请输入您获取的卡密激活码 (如 VIP-XXXX-XXXX)"
                  value={regInviteCode}
                  onChange={(e) => setRegInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono tracking-wider border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Username & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    登录用户名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="字母或数字组合"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    用户昵称 (选填)
                  </label>
                  <input
                    type="text"
                    placeholder="展示名称"
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    设置登录密码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="不少于6位密码"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    确认登录密码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="再次输入以确认"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>正在提交注册...</span>
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>立即激活并开通 VIP 会员</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  用户名
                </label>
                <input
                  type="text"
                  placeholder="请输入您的会员用户名"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  placeholder="请输入登录密码"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? '正在验证身份...' : '登录会员账户'}
              </button>
            </form>
          )}

          {/* Reserved Invite link footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>还没有会员卡密？</span>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
            >
              <span>在线购买卡密 / 联系客服</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
