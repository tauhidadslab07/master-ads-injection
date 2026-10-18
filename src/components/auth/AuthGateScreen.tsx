'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';

export function AuthGateScreen() {
  const { loginWithCredentials } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('ইউজার আইডি এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setIsLoading(true);
    const res = loginWithCredentials(username, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'ভুল ইউজার আইডি অথবা পাসওয়ার্ড। আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cyan-600/15 via-emerald-500/10 to-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl shadow-cyan-950/60 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center space-x-2">
            <span>MASTER ADS INJECTION</span>
          </h1>
          <p className="text-xs sm:text-sm text-cyan-400 font-semibold tracking-wide flex items-center justify-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>সুরক্ষিত মেম্বার অ্যাক্সেস গেটওয়ে (Secure CRM Gate)</span>
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            সিআরএম সিস্টেমে প্রবেশ করতে আপনার নির্দিষ্ট <span className="text-slate-200 font-bold">User ID</span> এবং <span className="text-slate-200 font-bold">Password</span> প্রদান করুন।
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>User ID (ইউজার আইডি)</span>
                <span className="text-[10px] text-cyan-400 font-normal">যেমন: tauhid, sakib...</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  required
                  placeholder="আপনার ইউজার আইডি লিখুন"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Password (পাসওয়ার্ড)</span>
                <span className="text-[10px] text-slate-500 font-normal">কেস সেনসিটিভ</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  required
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-300 text-xs flex items-center space-x-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-semibold leading-snug">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 mt-2"
            >
              <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Enter CRM)'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Security Footer Note */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© 2026 Master Ads Injection Enterprise. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-[10px]">অননুমোদিত প্রবেশ আইনত দণ্ডনীয় ও এনক্রিপ্টেড লগ ট্র্যাকিং সক্রিয়।</p>
        </div>

      </div>

    </div>
  );
}
