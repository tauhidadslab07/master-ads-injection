'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context/app-context';
import { 
  Zap, 
  Layers, 
  Target, 
  Calendar, 
  FolderKanban, 
  BarChart3, 
  FileText, 
  Database, 
  Users, 
  ShieldAlert,
  Flame,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Crown,
  Lock,
  X
} from 'lucide-react';

interface SidebarProps {
  onOpenTeamModal: () => void;
  onOpenBatchModal: () => void;
  onOpenNichesModal?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ 
  onOpenTeamModal, 
  onOpenBatchModal, 
  onOpenNichesModal,
  isMobileOpen = false,
  onMobileClose
}: SidebarProps) {
  const pathname = usePathname();
  const { 
    leads, 
    retroactiveDuplicates, 
    currentUser, 
    selectedNiche, 
    setIsNichesModalOpen, 
    teamMembers,
    leaderSession,
    dailyTasks,
    setIsLoginModalOpen,
    inspectMember,
    exitInspection
  } = useApp();

  const isLeader = currentUser.role === 'team_leader' || !!leaderSession;
  const isDeputy = currentUser.is_deputy;

  // Counters
  const todayDueCount = leads.filter(l => l.stage === 'contacted' || l.stage === 'approved').length;
  const leadStoreCount = leads.filter(l => l.stage === 'lead_added' || l.stage === 'audit').length;
  const auditedLeadCount = leads.filter(l => l.stage === 'audited').length;
  const pipelineCount = leads.filter(l => ['audit', 'sales_pipeline'].includes(l.stage)).length;
  const duplicateCount = retroactiveDuplicates.length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onMobileClose}
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar (Desktop Sticky + Mobile Slide-out Drawer) */}
      <aside className={`
        ${isMobileOpen 
          ? 'fixed inset-y-0 left-0 z-50 w-72 flex animate-in slide-in-from-left duration-200' 
          : 'hidden lg:flex w-64'
        }
        bg-slate-950 border-r border-slate-800/80 flex-col shrink-0 min-h-screen text-xs select-none shadow-2xl lg:shadow-none
      `}>
        
        {/* Brand Header (Click to navigate to Home Page) */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-850">
          <Link 
            href="/"
            onClick={onMobileClose}
            className="flex items-center space-x-3 group/brand hover:opacity-95 transition-all cursor-pointer"
            title="Go to Today's Work / Home Page"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/40 group-hover/brand:scale-105 group-hover/brand:border-emerald-400 transition-all">
              <Zap className="w-5 h-5 fill-emerald-400 stroke-emerald-950" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wide text-white block leading-tight group-hover/brand:text-emerald-400 transition-colors">
                MASTER ADS
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                INJECTION ENGINE
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        
        {/* WORKSPACES Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Workspaces
          </p>

          {/* Today's Work */}
          <Link
            href="/"
            onClick={onMobileClose}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
              pathname === '/'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Today's Work</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300">
                {todayDueCount}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                1
              </span>
            </div>
          </Link>

          {/* 🌟 LEADS MENU (লিড) WITH SUB-MENUS */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider bg-slate-900/70 border border-slate-800 mb-1.5">
              <div className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Leads (লিড)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {leadStoreCount + auditedLeadCount}
              </span>
            </div>

            {/* Sub-menus: 1. Lead Store, 2. Audited Lead */}
            <div className="pl-2 space-y-1 mt-1 border-l-2 border-emerald-500/20 ml-3">
              {/* 1. Lead Store */}
              <Link
                href="/lead-store"
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  pathname === '/lead-store'
                    ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 shadow-md shadow-cyan-950/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>1. Lead Store</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  pathname === '/lead-store' ? 'bg-cyan-900/90 text-cyan-200' : 'bg-slate-900 text-slate-400'
                }`}>
                  {leadStoreCount}
                </span>
              </Link>

              {/* 2. Audited Lead */}
              <Link
                href="/audited-leads"
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  pathname === '/audited-leads'
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-md shadow-emerald-950/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>2. Audited Lead</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  pathname === '/audited-leads' ? 'bg-emerald-900/90 text-emerald-200' : 'bg-slate-900 text-slate-400'
                }`}>
                  {auditedLeadCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Leads Outreach Pool */}
          <Link
            href="/outreach-pool"
            onClick={onMobileClose}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
              pathname === '/outreach-pool'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Outreach Pool</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900/60 text-cyan-300">
                {leads.filter(l => !['sales_pipeline', 'closed_won', 'closed_lost'].includes(l.stage)).length}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                H
              </span>
            </div>
          </Link>

          {/* Leads Pipeline */}
          <Link
            href="/sales-pipeline"
            onClick={onMobileClose}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
              pathname === '/sales-pipeline'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Sales Pipeline</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300">
                {pipelineCount}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                C
              </span>
            </div>
          </Link>

          {/* Niches / Categories Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNichesModal) onOpenNichesModal();
              else setIsNichesModalOpen(true);
              onMobileClose?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-98 ${
              selectedNiche !== 'all'
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
            title="Inspect Ad Niches & Segmentation Deck"
          >
            <div className="flex items-center space-x-2.5">
              <FolderKanban className={`w-4 h-4 ${selectedNiche !== 'all' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Ad Niches</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/50 text-emerald-400 border border-emerald-800/60">
              4 N
            </span>
          </button>

          {/* Intelligent Ad Audits */}
          <button
            type="button"
            onClick={onMobileClose}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Ad Audits Deck</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              {leads.filter(l => l.stage === 'audit').length}
            </span>
          </button>

          {/* 📊 PERFORMANCE SECTION (পারফরমেন্স) */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider bg-slate-900/70 border border-slate-800 mb-1.5">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Performance (পারফরমেন্স)</span>
              </div>
            </div>

            {/* Sub-menus */}
            <div className="pl-2 space-y-1 mt-1 border-l-2 border-purple-500/20 ml-3">
              {/* 1. Individual Performance */}
              <Link
                href="/performance/individual"
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  pathname === '/performance/individual'
                    ? 'bg-purple-950/90 text-purple-300 border border-purple-500/60 shadow-md shadow-purple-950/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>1. Individual Performance</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  pathname === '/performance/individual' ? 'bg-purple-900/80 text-purple-200' : 'bg-slate-900 text-slate-400'
                }`}>
                  {teamMembers.length}
                </span>
              </Link>

              {/* 2. Team Performance */}
              <Link
                href="/performance/team"
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  pathname === '/performance/team'
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-md shadow-emerald-950/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>2. Team Performance</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  pathname === '/performance/team' ? 'bg-emerald-900/80 text-emerald-200' : 'bg-slate-900 text-slate-400'
                }`}>
                  Funnel
                </span>
              </Link>
            </div>
          </div>

          {/* TEAM LEADER EXCLUSIVE: Daily Task Dispatcher */}
          {isLeader && (
            <div className="pt-2">
              <p className="px-3 text-[10px] uppercase font-black tracking-wider text-amber-400 mb-1 flex items-center justify-between">
                <span>👑 Leader Zone</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-black border border-amber-500/40">Exclusive</span>
              </p>
              <Link
                href="/leader-tasks"
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all ${
                  pathname === '/leader-tasks'
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-500/70 shadow-lg shadow-amber-950/60 font-black'
                    : 'text-amber-200/90 bg-amber-950/20 border border-amber-500/20 hover:bg-amber-950/50 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Leader Task Board</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {dailyTasks.length}
                </span>
              </Link>
            </div>
          )}

        </div>

        {/* OPERATIONS Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Operations
          </p>

          {/* Cadence Scripts */}
          <button
            type="button"
            onClick={() => {
              onOpenBatchModal?.();
              onMobileClose?.();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Cadence Scripts</span>
          </button>

          {/* Backup & Export */}
          <button
            type="button"
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Backup & Sync</span>
          </button>

          {/* Team & Access */}
          <button
            type="button"
            onClick={() => {
              onOpenTeamModal?.();
              onMobileClose?.();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Users className="w-4 h-4 text-rose-400" />
              <span>Team & Access</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-950 border border-rose-800 text-rose-300">
              {isLeader ? 'ADMIN' : isDeputy ? 'DEPUTY' : 'TEAM'}
            </span>
          </button>

        </div>

      </div>

      {/* Footer User & Authentication Section */}
      <div className="p-3 border-t border-slate-850 bg-slate-950/80 text-[11px] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-200 block truncate max-w-[110px]">
                {currentUser.full_name}
              </span>
              <span className="text-[9px] text-cyan-400 font-mono">@{currentUser.username}</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-400 font-bold">
            🔥 {currentUser.consecutive_approvals}
          </span>
        </div>

        {/* Team Leader Inspection Exit Button if active */}
        {leaderSession && currentUser.id !== leaderSession.id && (
          <button
            onClick={() => {
              exitInspection();
              onMobileClose?.();
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-[10px] flex items-center justify-center space-x-1 transition-all"
          >
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
            <span>তৌহিদ (Leader)-এ ফিরুন</span>
          </button>
        )}

        {/* Login / Switch Account Button */}
        <button
          onClick={() => {
            setIsLoginModalOpen(true);
            onMobileClose?.();
          }}
          className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold text-[10px] flex items-center justify-center space-x-1.5 transition-colors"
        >
          <KeyRound className="w-3 h-3 text-cyan-400" />
          <span>আইডি ও পাসওয়ার্ড দিয়ে লগইন</span>
        </button>
      </div>

    </aside>
    </>
  );
}
