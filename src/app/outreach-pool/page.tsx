'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { LeadCard } from '@/components/leads/LeadCard';
import { Lead } from '@/types/crm';
import { 
  Zap, 
  MessageCircle, 
  Mail, 
  ShieldAlert, 
  Plus, 
  UploadCloud, 
  Filter, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Search,
  RotateCcw,
  Clock,
  ArrowRight
} from 'lucide-react';

interface OutreachPoolPageProps {
  onOpenCreateModal?: () => void;
  onOpenBatchModal?: () => void;
}

export default function OutreachPoolPage() {
  const { 
    leads, 
    currentUser, 
    setCurrentUser, 
    teamMembers, 
    channelFilter, 
    setChannelFilter, 
    setIsFocusModeOpen, 
    setSelectedLead, 
    setIsLeadDrawerOpen, 
    retroactiveDuplicates 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'cadence' | 'replied' | 'cold' | 'recycle' | 'duplicates'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // SECTION ISOLATION GUARD:
  // Exclusively for Hunters and Outreach Specialists. Sales Closers cannot access unless Team Leader.
  const isLeader = currentUser.role === 'team_leader';
  const isHunterOrOutreach = currentUser.role === 'hunter' || currentUser.role === 'outreach_specialist';
  const hasAccess = isLeader || isHunterOrOutreach;

  // Duplicate lead IDs from retroactive scanner
  const duplicateLeadIds = useMemo(() => {
    const ids = new Set<string>();
    retroactiveDuplicates.forEach(group => {
      ids.add(group.lead.id);
      group.conflictingLeads.forEach(c => ids.add(c.id));
    });
    return ids;
  }, [retroactiveDuplicates]);

  // Channel live counts
  const whatsappCount = useMemo(() => {
    return leads.filter(l => l.channel === 'whatsapp').length;
  }, [leads]);

  const emailCount = useMemo(() => {
    return leads.filter(l => l.channel === 'email').length;
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Channel filter
      if (channelFilter === 'whatsapp' && l.channel !== 'whatsapp') return false;
      if (channelFilter === 'email' && l.channel !== 'email') return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesComp = l.company_name.toLowerCase().includes(query);
        const matchesCont = l.contact_name.toLowerCase().includes(query);
        const matchesPhone = l.phone.includes(query);
        const matchesEmail = l.email.toLowerCase().includes(query);
        if (!matchesComp && !matchesCont && !matchesPhone && !matchesEmail) return false;
      }

      // Stage / Category Tab
      if (activeTab === 'pending') return l.stage === 'pending_approval';
      if (activeTab === 'approved') return l.stage === 'approved';
      if (activeTab === 'cadence') return l.stage === 'contacted' || l.stage === 'lead_added';
      if (activeTab === 'replied') return l.stage === 'replied';
      if (activeTab === 'cold') return l.stage === 'cold';
      if (activeTab === 'recycle') return l.stage === 'recycle_pool';
      if (activeTab === 'duplicates') return duplicateLeadIds.has(l.id);

      // Default 'all' in outreach pool shows leads not yet in closing/sales pipeline
      return l.stage !== 'sales_pipeline' && l.stage !== 'closed_won' && l.stage !== 'closed_lost';
    });
  }, [leads, channelFilter, searchQuery, activeTab, duplicateLeadIds]);

  const handleOpenDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDrawerOpen(true);
  };

  // ACCESS DENIAL SCREEN FOR SALES CLOSERS
  if (!hasAccess) {
    const hunterMember = teamMembers.find(m => m.role === 'hunter');
    const leaderMember = teamMembers.find(m => m.role === 'team_leader');

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-900/60 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Outreach Pool Access Restricted
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Under Master Ads Injection Section Isolation policies, the <strong>Outreach Pool</strong> is reserved strictly for <strong>Hunters and Outreach Specialists</strong>. Sales Closers are isolated to the Sales Pipeline.
          </p>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-500 font-semibold">Switch Persona to Inspect Outreach Pool:</p>
            <div className="flex items-center justify-center space-x-2">
              {hunterMember && (
                <button
                  onClick={() => setCurrentUser(hunterMember)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Switch to Hunter ({hunterMember.full_name.split(' ')[0]})
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
              Outreach Pool
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold text-xs">
              Hunters & Cadence Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Top-of-funnel lead discovery, cadence progression & leader approval gate
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFocusModeOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Focus Mode</span>
          </button>
        </div>
      </div>

      {/* CHANNEL FILTER TABS (With Live Counter Badges) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-800">
        
        {/* Channel Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              channelFilter === 'all'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>[All Channels]</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-slate-300 font-mono">
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter('whatsapp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              channelFilter === 'whatsapp'
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>[💬 WhatsApp Only]</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900/60 text-emerald-300 font-mono">
              {whatsappCount}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter('email')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              channelFilter === 'email'
                ? 'bg-cyan-950/90 border border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>[📧 Email Only]</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-900/60 text-cyan-300 font-mono">
              {emailCount}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, phone, email..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* STAGE & CATEGORY NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'all' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Outreach Leads ({leads.filter(l => l.stage !== 'sales_pipeline' && l.stage !== 'closed_won' && l.stage !== 'closed_lost').length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
            activeTab === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <span>Pending Approval</span>
          <span className="px-1.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
            {leads.filter(l => l.stage === 'pending_approval').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          Approved ({leads.filter(l => l.stage === 'approved').length})
        </button>

        <button
          onClick={() => setActiveTab('cadence')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'cadence' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          In Cadence ({leads.filter(l => l.stage === 'contacted' || l.stage === 'lead_added').length})
        </button>

        <button
          onClick={() => setActiveTab('replied')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'replied' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'text-slate-400 hover:text-blue-300'
          }`}
        >
          Replied / Ready for Audit ({leads.filter(l => l.stage === 'replied').length})
        </button>

        <button
          onClick={() => setActiveTab('cold')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'cold' ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Cold ({leads.filter(l => l.stage === 'cold').length})
        </button>

        <button
          onClick={() => setActiveTab('recycle')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
            activeTab === 'recycle' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-sky-300'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Recycle Pool ({leads.filter(l => l.stage === 'recycle_pool').length})</span>
        </button>

        {/* RETROACTIVE DUPLICATE TAB */}
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'duplicates'
              ? 'bg-amber-950/80 border border-amber-500 text-amber-300'
              : 'text-amber-400 hover:bg-amber-950/30'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>⚠️ Duplicate Contacts ({duplicateLeadIds.size})</span>
        </button>
      </div>

      {/* LEADS GRID */}
      {filteredLeads.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Leads Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No contacts match the selected stage and channel filters. Add a new lead or adjust your filter selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isDup = duplicateLeadIds.has(lead.id);

            return (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpenDetails={handleOpenDetails}
                showHunterBadge={true}
                isDuplicateFlagged={isDup}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}
