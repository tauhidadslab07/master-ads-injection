'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lock, User, KeyRound, CheckCircle2, Shield, X, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { teamMembers, currentUser, loginWithCredentials, setCurrentUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both User ID and Password.');
      return;
    }

    const res = loginWithCredentials(username, password);
    if (res.success) {
      setError(null);
      onClose();
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleQuickLogin = (member: typeof teamMembers[0]) => {
    setCurrentUser(member);
    if (typeof window !== 'undefined') {
      localStorage.setItem('master_ads_user_id', member.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Member Profile Login
              </h2>
              <p className="text-xs text-slate-400">
                Log in with your User ID & Password (No email needed)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Current User Status Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-xs font-bold text-cyan-300">
                {currentUser.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Logged in as: <span className="text-cyan-400">{currentUser.full_name}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: @{currentUser.username} • Role: {currentUser.role === 'team_leader' ? '👑 Team Leader' : '💬 Outreach Rep'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
              Active Session
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. tauhid, mustafizur, tahmeed..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your password (default: 123)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-opacity"
            >
              Sign In to Workspace
            </button>
          </form>

          {/* Quick Member Selection Cheat-Sheet */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>⚡ 1-Click Fast Member Access</span>
              <span className="text-[10px] text-slate-500 font-normal">Password: 123</span>
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {teamMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleQuickLogin(m)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left border text-xs transition-all ${
                    m.id === currentUser.id
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="font-bold text-white truncate flex items-center space-x-1">
                      <span>{m.full_name}</span>
                      {m.role === 'team_leader' && <span className="text-amber-400">👑</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">@{m.username}</p>
                  </div>
                  {m.id === currentUser.id && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
