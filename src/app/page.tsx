'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { 
  Zap, 
  Layers, 
  TrendingUp, 
  Trophy, 
  ShieldAlert, 
  Users, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HomePageProps {
  onOpenCreateModal?: () => void;
  onOpenBatchModal?: () => void;
  onOpenTeamModal?: () => void;
  onOpenDuplicateModal?: () => void;
}

export default function HomePage({
  onOpenCreateModal,
  onOpenBatchModal,
  onOpenTeamModal,
  onOpenDuplicateModal
}: HomePageProps) {
  const { 
    leads, 
    activities, 
    mistakes, 
    currentUser, 
    setIsFocusModeOpen, 
    setSelectedLead, 
    setIsLeadDrawerOpen, 
    retroactiveDuplicates 
  } = useApp();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLeader = currentUser.role === 'team_leader';
  const isHunter = currentUser.role === 'hunter' || currentUser.role === 'outreach_specialist';
  const isCloser = currentUser.role === 'sales_closer';

  // Metrics
  const outreachPoolCount = leads.filter(l => !['sales_pipeline', 'closed_won', 'closed_lost', 'archived'].includes(l.stage)).length;
  const pendingApprovalCount = leads.filter(l => l.stage === 'pending_approval').length;
  const auditsCount = leads.filter(l => l.stage === 'audit').length;
  const activePipelineValue = leads
    .filter(l => ['sales_pipeline', 'audit'].includes(l.stage))
    .reduce((acc, curr) => acc + (Number(curr.deal_value) || 0), 0);
  const closedWonValue = leads
    .filter(l => l.stage === 'closed_won')
    .reduce((acc, curr) => acc + (Number(curr.deal_value) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Executive Header */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agency Operations Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Master Ads Injection
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise Ads Outreach, Auditing & Sales Pipeline Hub. Built with Section Isolation, real-time deduplication matching, trusted hunter approval gates, and 5-step cadence automation.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsFocusModeOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/25 active:scale-95 transition-all flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Outreach Focus</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Outreach Pool Leads */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Outreach Pool</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">{outreachPoolCount}</p>
          <p className="text-[11px] text-cyan-400 font-medium mt-1">
            {pendingApprovalCount} awaiting approval
          </p>
        </div>

        {/* Audits In Flight */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Ad Audits In Flight</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{auditsCount}</p>
          <p className="text-[11px] text-purple-400 font-medium mt-1">
            Triggered from replied leads
          </p>
        </div>

        {/* Sales Pipeline Value */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pipeline Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">${activePipelineValue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">
            Monthly recurring retainer
          </p>
        </div>

        {/* Closed Won Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Closed Won MRR</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">${closedWonValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Lifetime contracts executed
          </p>
        </div>

      </div>

      {/* TWO ISOLATED WORKSPACES SHOWCASE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Outreach Pool Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-cyan-900/50 hover:border-cyan-500/60 shadow-xl space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Hunters Only
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Outreach Pool Workspace</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Exclusively for Hunters and Outreach Specialists. Manage incoming prospect leads, 5-step cadence engine (Day 0 through Day 14), WhatsApp & Email channel filtering, and approval gate queues.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/outreach-pool"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              <span>Enter Outreach Pool</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sales Pipeline Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-900/50 hover:border-emerald-500/60 shadow-xl space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Sales Closers Only
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Sales Pipeline Workspace</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Exclusively for Sales Closers and Team Leaders. Qualified leads enter after replying and completing competitor ad audits. Permanent hunter attribution guaranteed on every card.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/sales-pipeline"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              <span>Enter Sales Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY LOG & MISTAKE GUARD AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Notes Stream (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Activity Feed & Notes</span>
            </h3>
            <span className="text-xs text-slate-500">Live reverse-chronological</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {activities.slice(0, 6).map((act) => {
              let timeStr = 'Recently';
              if (mounted) {
                try {
                  timeStr = formatDistanceToNow(new Date(act.created_at), { addSuffix: true });
                } catch {}
              }

              return (
                <div key={act.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-cyan-300">
                      {act.author?.full_name || 'Team Member'}
                    </span>
                    <span className="text-slate-500">{timeStr}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-2">{act.content}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mistake Guard Audit Monitor (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-rose-900/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-300 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Mistake Guard Log</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              {mistakes.length} Incident(s)
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {mistakes.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>Zero mistakes recorded. Follow-up safeguards active.</span>
              </div>
            ) : (
              mistakes.map((mst) => (
                <div key={mst.id} className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-400">
                      Blocked Follow-Up
                    </span>
                    <span className="text-[10px] text-slate-500">Auto-logged</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {mst.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
