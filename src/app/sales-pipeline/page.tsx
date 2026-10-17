'use client';

import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '@/lib/context/app-context';
import { LeadCard } from '@/components/leads/LeadCard';
import { Lead } from '@/types/crm';
import { soundEngine } from '@/lib/audio-chime';
import { 
  Layers, 
  DollarSign, 
  Trophy, 
  TrendingUp, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SalesPipelinePage() {
  const { 
    leads, 
    currentUser, 
    setCurrentUser, 
    teamMembers, 
    setSelectedLead, 
    setIsLeadDrawerOpen, 
    updateLead, 
    addActivityNote 
  } = useApp();

  const [pipelineTab, setPipelineTab] = useState<'all' | 'audit' | 'negotiation' | 'won' | 'lost'>('all');

  // SECTION ISOLATION GUARD:
  // Exclusively for Sales Closers and Team Leaders. Hunters/Outreach cannot access unless Team Leader.
  const isLeader = currentUser.role === 'team_leader';
  const isCloser = currentUser.role === 'sales_closer';
  const hasAccess = isLeader || isCloser;

  // Filter leads in sales stages
  const pipelineLeads = useMemo(() => {
    return leads.filter(l => {
      if (pipelineTab === 'audit') return l.stage === 'audit';
      if (pipelineTab === 'negotiation') return l.stage === 'sales_pipeline';
      if (pipelineTab === 'won') return l.stage === 'closed_won';
      if (pipelineTab === 'lost') return l.stage === 'closed_lost';

      // Default 'all' in sales pipeline shows all sales stages
      return l.stage === 'audit' || l.stage === 'sales_pipeline' || l.stage === 'closed_won' || l.stage === 'closed_lost';
    });
  }, [leads, pipelineTab]);

  // Financial Metrics
  const activeNegotiationValue = useMemo(() => {
    return leads
      .filter(l => l.stage === 'sales_pipeline' || l.stage === 'audit')
      .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
  }, [leads]);

  const closedWonValue = useMemo(() => {
    return leads
      .filter(l => l.stage === 'closed_won')
      .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
  }, [leads]);

  const closedWonCount = useMemo(() => {
    return leads.filter(l => l.stage === 'closed_won').length;
  }, [leads]);

  const handleOpenDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDrawerOpen(true);
  };

  // Close Deal as WON with confetti celebration
  const handleMarkWon = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    updateLead(leadId, {
      stage: 'closed_won',
      last_client_reaction: 'interested'
    });

    addActivityNote(
      leadId,
      `🎉 DEAL WON! Closed at $${lead.deal_value?.toLocaleString()}/mo retainer by ${currentUser.full_name}. Hunter commission attributed to ${lead.hunter?.full_name}.`,
      [lead.original_hunter_id],
      'status_change'
    );

    soundEngine.playSuccessChime();

    // Trigger visual celebratory confetti explosion
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const handleMarkLost = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    updateLead(leadId, {
      stage: 'closed_lost'
    });
    addActivityNote(leadId, `Deal marked Closed Lost.`, [], 'status_change');
  };

  // ACCESS RESTRICTION SCREEN FOR HUNTERS
  if (!hasAccess) {
    const closerMember = teamMembers.find(m => m.role === 'sales_closer');
    const leaderMember = teamMembers.find(m => m.role === 'team_leader');

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-900/60 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Sales Pipeline Access Restricted
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Under Master Ads Injection Section Isolation policies, the <strong>Sales Pipeline</strong> is restricted exclusively to <strong>Sales Closers and Team Leaders</strong>. Hunters and Outreach Specialists cannot view ongoing deal closings.
          </p>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-500 font-semibold">Switch Persona to Inspect Sales Pipeline:</p>
            <div className="flex items-center justify-center space-x-2">
              {closerMember && (
                <button
                  onClick={() => setCurrentUser(closerMember)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Switch to Closer ({closerMember.full_name.split(' ')[0]})
                </button>
              )}
              {leaderMember && (
                <button
                  onClick={() => setCurrentUser(leaderMember)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Switch to Leader ({leaderMember.full_name.split(' ')[0]})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sales Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-xs">
              Closers & Deal Executive Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditing handovers, proposal negotiation & permanent hunter commission attribution
          </p>
        </div>
      </div>

      {/* METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Active Pipeline Value */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-inner flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Active Pipeline Value</p>
            <p className="text-2xl font-black text-white mt-1">
              ${activeNegotiationValue.toLocaleString()}
              <span className="text-xs text-cyan-400 font-bold ml-1">/mo</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Across audits & active negotiations</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Closed Won Retainers */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-900/60 shadow-inner flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400">Closed Won Retainers</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">
              ${closedWonValue.toLocaleString()}
              <span className="text-xs text-emerald-400 font-bold ml-1">/mo</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{closedWonCount} contracts executed</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Closing Win Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-inner flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Audits to Closer Velocity</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">
              64.2%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Audit-to-closed contract conversion</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* STAGE TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setPipelineTab('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            pipelineTab === 'all' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Pipeline Deals ({leads.filter(l => ['audit', 'sales_pipeline', 'closed_won', 'closed_lost'].includes(l.stage)).length})
        </button>

        <button
          onClick={() => setPipelineTab('audit')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
            pipelineTab === 'audit' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <span>Audits In Progress</span>
          <span className="px-1.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
            {leads.filter(l => l.stage === 'audit').length}
          </span>
        </button>

        <button
          onClick={() => setPipelineTab('negotiation')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
            pipelineTab === 'negotiation' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          <span>Active Negotiations</span>
          <span className="px-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
            {leads.filter(l => l.stage === 'sales_pipeline').length}
          </span>
        </button>

        <button
          onClick={() => setPipelineTab('won')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
            pipelineTab === 'won' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          <span>Closed Won</span>
          <span className="px-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
            {leads.filter(l => l.stage === 'closed_won').length}
          </span>
        </button>

        <button
          onClick={() => setPipelineTab('lost')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
            pipelineTab === 'lost' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          <span>Closed Lost</span>
          <span className="px-1.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
            {leads.filter(l => l.stage === 'closed_lost').length}
          </span>
        </button>
      </div>

      {/* PIPELINE CARDS GRID */}
      {pipelineLeads.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Pipeline Deals in this Stage</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Leads enter the Sales Pipeline once an outreach prospect has Replied and an Audit task has been triggered.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelineLeads.map((lead) => (
            <div key={lead.id} className="relative group">
              {/* Permanent Hunter Attribution is strictly set to true on all sales pipeline cards */}
              <LeadCard
                lead={lead}
                onOpenDetails={handleOpenDetails}
                showHunterBadge={true}
              />

              {/* Quick Closer Action Buttons (Won / Lost) for active pipeline */}
              {lead.stage === 'sales_pipeline' && (
                <div className="mt-2 flex items-center space-x-2 px-1">
                  <button
                    onClick={(e) => handleMarkWon(e, lead.id)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center space-x-1"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Close Won</span>
                  </button>
                  <button
                    onClick={(e) => handleMarkLost(e, lead.id)}
                    className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 font-semibold text-xs transition-colors"
                  >
                    Lost
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
