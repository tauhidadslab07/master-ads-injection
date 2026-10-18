'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { exportLeadsToCsv } from '@/lib/export-utils';
import { 
  Search, 
  Layers, 
  Download, 
  FileText, 
  Database, 
  UploadCloud, 
  Plus, 
  Users, 
  LogOut, 
  RotateCw,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldAlert,
  Crown,
  Lock,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Menu
} from 'lucide-react';

interface TopHeaderProps {
  onOpenCreateModal: () => void;
  onOpenBatchModal: () => void;
  onOpenTeamModal: () => void;
  onOpenDuplicateModal: () => void;
  onOpenNichesModal?: () => void;
  onOpenMobileDrawer?: () => void;
  onOpenExportModal?: () => void;
  onOpenCloudSyncModal?: () => void;
}

export function TopHeader({
  onOpenCreateModal,
  onOpenBatchModal,
  onOpenTeamModal,
  onOpenDuplicateModal,
  onOpenNichesModal,
  onOpenMobileDrawer,
  onOpenExportModal,
  onOpenCloudSyncModal
}: TopHeaderProps) {
  const { 
    currentUser, 
    setCurrentUser, 
    teamMembers, 
    leads, 
    retroactiveDuplicates, 
    setIsFocusModeOpen,
    selectedNiche,
    setIsNichesModalOpen,
    leaderSession,
    inspectMember,
    exitInspection,
    logout,
    setIsLoginModalOpen
  } = useApp();

  const [searchVal, setSearchVal] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const duplicateCount = retroactiveDuplicates.length;
  const isLeader = currentUser.role === 'team_leader' || !!leaderSession;

  const handleExportCsv = () => {
    exportLeadsToCsv(leads, 'Master_Ads_Injection_All_Leads.csv');
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <header className="h-16 w-full bg-slate-950 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
      
      {/* Left: Mobile Brand + Search Input */}
      <div className="flex items-center space-x-3 flex-1 max-w-xs sm:max-w-md">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Global Search */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search leads, phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
        </div>
      </div>

      {/* Center: Action Pill Buttons (Matching Nexus Screenshot) */}
      <div className="hidden xl:flex items-center space-x-1.5">
        
        {/* Niches Button (Click to open Ad Niches & Pipeline Segmentation Modal) */}
        <button
          type="button"
          onClick={onOpenNichesModal || (() => setIsNichesModalOpen(true))}
          className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center space-x-1.5 transition-all active:scale-95 ${
            selectedNiche !== 'all'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white'
          }`}
          title="Manage Ad Niches, Filter Conversion Angles & Target Spend"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Niches</span>
          {selectedNiche !== 'all' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        {/* Export Leads (Excel / CSV with Filters) */}
        <button
          type="button"
          onClick={onOpenExportModal || handleExportCsv}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
          title="Export Leads with Custom Niche & Stage Filters"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export</span>
        </button>

        {/* Scripts / Focus Mode */}
        <button
          type="button"
          onClick={() => setIsFocusModeOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scripts</span>
        </button>

        {/* Central Cloud Database Sync */}
        <button
          type="button"
          onClick={onOpenCloudSyncModal || handleSync}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
          title="Central Cloud Database Sync (Supabase Live)"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="flex items-center space-x-1">
            <span>Cloud Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </button>

        {/* Bulk Import */}
        <button
          type="button"
          onClick={onOpenBatchModal}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bulk Import</span>
        </button>

        {/* Add Lead (Filled Emerald Button) */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Lead</span>
        </button>

        {/* Team (Maroon/Rose Pill Button) */}
        <button
          type="button"
          onClick={onOpenTeamModal}
          className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-800/80 hover:bg-rose-900/80 text-rose-300 font-bold flex items-center space-x-1.5 transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span>Team</span>
        </button>

      </div>

      {/* Right: User Profile & Refresh Actions */}
      <div className="flex items-center space-x-2">
        
        {/* Mobile + Add Lead button if screen small */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="xl:hidden px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add</span>
        </button>

        {/* Duplicate Badge */}
        {duplicateCount > 0 && (
          <button
            type="button"
            onClick={onOpenDuplicateModal}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[11px] font-bold"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>{duplicateCount} Dups</span>
          </button>
        )}

        {/* Profile & Role-Restricted Switcher Dropdown */}
        <div className="relative group">
          <div className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors">
            <div className="hidden sm:block text-right leading-tight">
              <span className="font-bold text-white text-xs block flex items-center justify-end space-x-1">
                <span>{currentUser.full_name}</span>
                {currentUser.role === 'team_leader' && <span className="text-amber-400 text-[10px]">👑</span>}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                {currentUser.role === 'team_leader' ? 'TEAM LEADER' : currentUser.is_deputy ? 'DEPUTY' : 'OUTREACH REP'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs shadow-inner">
              {currentUser.full_name.charAt(0)}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </div>

          {/* Profile Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 hidden group-hover:block hover:block z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* Header info */}
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-xs">{currentUser.full_name}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">@{currentUser.username}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentUser.role === 'team_leader' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {currentUser.role === 'team_leader' ? '👑 Leader' : 'Sales Outreach'}
                </span>
              </div>
            </div>

            {/* If Team Leader or inspecting -> Show "Go" Section for all members */}
            {isLeader ? (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-cyan-300 font-extrabold text-[11px] uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>🚀 Go (Inspect Member Profile)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200 font-bold">
                    Tauhid Exclusive
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  টিম লিডার হিসেবে যেকোনো মেম্বারের প্রোফাইল ও ড্যাশবোর্ডে সরাসরি প্রবেশ করুন:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 max-h-48 overflow-y-auto">
                  {teamMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => inspectMember(m)}
                      className={`px-2 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-all flex items-center justify-between group/go ${
                        m.id === currentUser.id
                          ? 'bg-cyan-900/80 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950/80 border-slate-800 hover:border-cyan-400 hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{m.full_name}</span>
                      <span className="text-[9px] text-cyan-400 group-hover/go:translate-x-0.5 transition-transform shrink-0 ml-1">
                        {m.id === currentUser.id ? '✓ Active' : 'Go →'}
                      </span>
                    </button>
                  ))}
                </div>
                {leaderSession && currentUser.id !== leaderSession.id && (
                  <button
                    onClick={exitInspection}
                    className="w-full mt-1.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center space-x-1 transition-all"
                  >
                    <ArrowLeft className="w-3 h-3 stroke-[3]" />
                    <span>তৌহিদ (Team Leader)-এ ফেরত যান</span>
                  </button>
                )}
              </div>
            ) : (
              /* Regular Member Security Notice: Profile is locked */
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 mb-2">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>🔒 সিকিউর মেম্বার অ্যাকাউন্ট</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  আপনার অ্যাকাউন্ট প্রোটেক্টেড। শুধুমাত্র টিম লিডার তৌহিদ যেকোনো প্রোফাইল পর্যবেক্ষণ করার ক্ষমতা রাখেন।
                </p>
              </div>
            )}

            {/* Action Buttons: Switch Account / Sign Out */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>আইডি ও পাসওয়ার্ড দিয়ে লগইন (Switch Account)</span>
              </button>
              <button
                onClick={logout}
                className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 hover:border-rose-600 text-rose-300 hover:text-rose-100 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগ আউট (Sign Out)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={handleSync}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Sync & Refresh Data"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

      </div>

    </header>
  );
}
