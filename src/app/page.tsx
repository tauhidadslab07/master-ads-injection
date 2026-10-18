'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead, CADENCE_STEPS, ClientReaction } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { LeadTableView } from '@/components/leads/LeadTableView';
import { 
  Zap, 
  Flame, 
  AlertTriangle, 
  Volume2, 
  Smartphone, 
  MessageCircle, 
  Mail, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  ExternalLink,
  Target,
  Sparkles,
  ShieldAlert,
  List,
  LayoutList
} from 'lucide-react';

export default function HomePage() {
  const { 
    leads, 
    currentUser, 
    teamMembers,
    setSelectedLead, 
    setIsLeadDrawerOpen, 
    advanceCadence, 
    updateClientReaction,
    retroactiveDuplicates 
  } = useApp();

  const [activeNiche, setActiveNiche] = useState('all');
  const [activeQueueTab, setActiveQueueTab] = useState<'all_due' | 'initial' | 'fu1' | 'fu2' | 'fu3' | 'fu4' | 'fu5' | 'all_done'>('all_due');
  const [activePriority, setActivePriority] = useState('all');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<'my' | 'all' | string>('all');
  const [selectedWhatsAppLine, setSelectedWhatsAppLine] = useState('primary');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Outreach Velocity metrics
  const completedTodayCount = leads.filter(l => l.stage === 'contacted' || l.stage === 'replied').length;
  const overdueCount = leads.filter(l => l.stage === 'contacted' && l.cadence_step >= 2).length;
  const progressPercent = Math.min(100, Math.round((completedTodayCount / dailyGoal) * 100));

  // Filter queues
  const queueLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.is_dnc) return false;

      // Assignee Filter
      if (selectedAssigneeFilter === 'my') {
        if (l.current_assignee_id && l.current_assignee_id !== currentUser.id) {
          return false;
        }
      } else if (selectedAssigneeFilter !== 'all') {
        if (l.current_assignee_id !== selectedAssigneeFilter) {
          return false;
        }
      }

      // Priority Filter
      if (activePriority === 'hot') {
        if (l.last_client_reaction !== 'interested') return false;
      } else if (activePriority === 'warm') {
        if (l.last_client_reaction !== 'replied' && l.last_client_reaction !== 'seen') return false;
      } else if (activePriority === 'cold') {
        if (l.stage !== 'cold' && l.last_client_reaction !== 'not_interested') return false;
      }

      // Cadence Step Filter
      if (activeQueueTab === 'initial') return l.cadence_step === 0;
      if (activeQueueTab === 'fu1') return l.cadence_step === 1;
      if (activeQueueTab === 'fu2') return l.cadence_step === 2;
      if (activeQueueTab === 'fu3') return l.cadence_step === 3;
      if (activeQueueTab === 'fu4') return l.cadence_step === 4;
      if (activeQueueTab === 'fu5') return l.cadence_step === 5;
      if (activeQueueTab === 'all_done') return l.cadence_step >= 6 || l.stage === 'all_done';

      // Default 'all_due': active leads requiring cadence outreach
      return (l.stage === 'contacted' || l.stage === 'approved' || l.stage === 'audited') && l.cadence_step < 6;
    });
  }, [leads, activeQueueTab, selectedAssigneeFilter, activePriority, currentUser]);

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDrawerOpen(true);
  };

  const handlePlayChime = () => {
    soundEngine.playMentionChime();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. DAILY OUTREACH VELOCITY CARD (Exact Nexus style) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5 fill-emerald-400 stroke-emerald-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Daily Outreach Velocity
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950/80 border border-amber-600/70 text-amber-300">
                  🔥 {currentUser.consecutive_approvals}-Day Streak!
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {dailyGoal - completedTodayCount > 0 
                  ? `${dailyGoal - completedTodayCount} more to hit your daily goal (${dailyGoal} target).`
                  : '🎯 Daily target achieved! Keep the momentum going.'}
              </p>
            </div>
          </div>

          {/* Goal pill on right */}
          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Goal: <strong>{dailyGoal}</strong></span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-white">
              {completedTodayCount} / {dailyGoal}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-black border border-emerald-800">
              {progressPercent}%
            </span>
          </div>

        </div>

        {/* Progress bar track */}
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Sub-status notice */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-300 font-semibold">
              {overdueCount} overdue follow-up(s) waiting for attention
            </span>
          </div>
          <span className="text-slate-500">Prioritized at top of queue</span>
        </div>
      </div>

      {/* 2. ATTENTION WARNING ALERT BAR (Maroon Card with Chime button) */}
      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/70 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-900/40 border border-rose-700/60 text-rose-400">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <p className="text-xs font-semibold text-rose-200">
            ⚠️ <strong>Attention:</strong> You have {overdueCount > 0 ? overdueCount : 1} overdue follow-up requiring immediate outreach!
          </p>
        </div>

        <button
          type="button"
          onClick={handlePlayChime}
          className="self-end sm:self-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-900/70 hover:bg-rose-800 border border-rose-600/70 text-rose-200 font-bold text-xs transition-colors shadow-sm active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Chime Alert</span>
        </button>
      </div>

      {/* 3. NICHE FILTER PILLS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs select-none">
        <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider shrink-0 flex items-center space-x-1">
          <span>NICHE:</span>
        </span>

        <button
          onClick={() => setActiveNiche('all')}
          className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
            activeNiche === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Niches
        </button>

        <button
          onClick={() => setActiveNiche('dtc')}
          className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
            activeNiche === 'dtc'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          E-Commerce Brands (DTC)
        </button>

        <button
          onClick={() => setActiveNiche('saas')}
          className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
            activeNiche === 'saas'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          B2B SaaS & Tech
        </button>

        <button
          onClick={() => setActiveNiche('agency')}
          className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
            activeNiche === 'agency'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          High-Ticket Coaching & Services
        </button>
      </div>

      {/* 4. ACTIVE WHATSAPP LINE SELECTOR */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider shrink-0">
            ACTIVE WHATSAPP LINE:
          </span>
          <select
            value={selectedWhatsAppLine}
            onChange={(e) => setSelectedWhatsAppLine(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-600/60 text-emerald-300 font-bold text-xs focus:outline-none"
          >
            <option value="primary">Primary Line (Main Agency) • +1 (415) 555-0199 (Default)</option>
            <option value="secondary">Secondary Line (Hunter Direct) • +1 (415) 890-1234</option>
            <option value="backup">Backup Line (Outreach Pool) • +44 20 7946 0912</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Anti-Spam Safety: Switch lines across outbound batches</span>
        </div>
      </div>

      {/* 5. TODAY'S WORK & CADENCE ACTION QUEUES SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
                <span>🎯 Today&apos;s Outreach Work</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase">
                Active Cadence Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated cadence progression: 1st Message → 1st to 5th Follow-up → All Done
            </p>
          </div>

          {/* Assignee Filter Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold">Assignee:</span>
            <select
              value={selectedAssigneeFilter}
              onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs text-slate-200 font-bold focus:outline-none"
            >
              <option value="all">👥 All Team Members</option>
              <option value="my">👤 My Assigned Work</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cadence Stage Tabs (1st Message -> 5th Follow-up -> All Done) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs select-none scrollbar-thin">
          <button
            onClick={() => setActiveQueueTab('all_due')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeQueueTab === 'all_due'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯 All Active Work</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-emerald-300 font-mono">
              {leads.filter(l => (l.stage === 'contacted' || l.stage === 'approved' || l.stage === 'audited') && l.cadence_step < 6 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('initial')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeQueueTab === 'initial'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🚀 1st Message</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-slate-300 font-mono">
              {leads.filter(l => l.cadence_step === 0 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('fu1')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeQueueTab === 'fu1'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔁 1st Follow-up</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-slate-300 font-mono">
              {leads.filter(l => l.cadence_step === 1 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('fu2')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeQueueTab === 'fu2'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔁 2nd Follow-up</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-slate-300 font-mono">
              {leads.filter(l => l.cadence_step === 2 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('fu3')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeQueueTab === 'fu3'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔁 3rd Follow-up</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-slate-300 font-mono">
              {leads.filter(l => l.cadence_step === 3 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('fu4')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeQueueTab === 'fu4'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔁 4th Follow-up</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-slate-300 font-mono">
              {leads.filter(l => l.cadence_step === 4 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('fu5')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeQueueTab === 'fu5'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔁 5th Follow-up</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-slate-300 font-mono">
              {leads.filter(l => l.cadence_step === 5 && !l.is_dnc).length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('all_done')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeQueueTab === 'all_done'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🎉 All Done</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/80 text-purple-300 font-mono">
              {leads.filter(l => (l.cadence_step >= 6 || l.stage === 'all_done') && !l.is_dnc).length}
            </span>
          </button>
        </div>

        {/* Priority Sub-filter Pills & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs select-none">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider shrink-0">
              PRIORITY:
            </span>

            <button
              onClick={() => setActivePriority('all')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                activePriority === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Leads
            </button>

            <button
              onClick={() => setActivePriority('hot')}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                activePriority === 'hot'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🔥 Hot Priority
            </button>

            <button
              onClick={() => setActivePriority('warm')}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                activePriority === 'warm'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Warm Touchpoints
            </button>

            <button
              onClick={() => setActivePriority('cold')}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                activePriority === 'cold'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ❄️ Cold Outreach
            </button>
          </div>

          {/* Table / Cards View Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View (Nexus Outreach Engine)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Table View</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Rows"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Card Rows</span>
            </button>
          </div>
        </div>

        {/* Lead Queue Items Display */}
        {queueLeads.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-300">No leads in this queue</p>
            <p className="text-xs text-slate-500">All cadence touchpoints are up to date.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="pt-2">
            <LeadTableView
              leads={queueLeads}
              onOpenDetails={handleOpenLead}
            />
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {queueLeads.map((lead) => {
              const hunterWaUrl = lead.hunter?.phone ? getWhatsAppUrl(lead.hunter.phone) : '#';
              const leadWaUrl = getWhatsAppUrl(
                lead.phone,
                `Hey ${lead.contact_name}, noticed ${lead.company_name} is actively scaling ads. We built a creative inject tear-sheet for your product category. Open to reviewing it?`
              );

              return (
                <div
                  key={lead.id}
                  onClick={() => handleOpenLead(lead)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/60 shadow-lg hover:shadow-emerald-950/20 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Left: Lead Overview */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors truncate">
                        {lead.company_name}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400">
                        Step {lead.cadence_step} ({CADENCE_STEPS[lead.cadence_step]?.dayLabel || 'Day 0'})
                      </span>
                      {lead.is_dnc && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
                          🚫 DNC
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                      <span>Contact: <strong className="text-slate-200">{lead.contact_name}</strong></span>
                      <span>Phone: <strong className="text-slate-200 font-mono">{lead.phone}</strong></span>
                      <span>Retainer: <strong className="text-emerald-400">${lead.deal_value?.toLocaleString()}/mo</strong></span>
                    </div>

                    {/* Hunter Attribution */}
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-0.5">
                      <span>👤 Collected by: <strong className="text-cyan-400">{lead.hunter?.full_name || 'Hunter'}</strong></span>
                    </div>
                  </div>

                  {/* Right: 1-Click WhatsApp Direct Hook & Action Buttons */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center space-x-2 shrink-0 self-start md:self-auto"
                  >
                    {/* WhatsApp Direct Action */}
                    <a
                      href={lead.is_dnc ? undefined : leadWaUrl}
                      target={lead.is_dnc ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      onClick={(e) => lead.is_dnc && e.preventDefault()}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                        lead.is_dnc
                          ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 active:scale-95'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Hook</span>
                    </a>

                    {/* Quick Advance Button */}
                    <button
                      type="button"
                      onClick={() => advanceCadence(lead.id, 'seen')}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Advance to next cadence follow-up"
                    >
                      <span>Advance</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
