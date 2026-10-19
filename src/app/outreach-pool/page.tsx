'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadTableView } from '@/components/leads/LeadTableView';
import { Lead } from '@/types/crm';
import { 
  Zap, 
  MessageCircle, 
  Mail, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  LayoutGrid,
  List,
  Users,
  Send,
  Database,
  ArrowRight,
  UserCheck,
  Check
} from 'lucide-react';

export default function OutreachPoolPage() {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    channelFilter, 
    setChannelFilter, 
    setIsFocusModeOpen, 
    setSelectedLead, 
    setIsLeadDrawerOpen, 
    retroactiveDuplicates 
  } = useApp();

  const isTeamLeader = currentUser.role === 'team_leader';

  // Cadence Step Filter: 'all' | 0 (1st Msg) | 1 (FU1) | 2 (FU2) | 3 (FU3) | 4 (FU4) | 5 (FU5) | 6 (All Done)
  const [cadenceFilter, setCadenceFilter] = useState<'all' | number>('all');
  
  // Member Filter (for Team Leader to inspect any member's work)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Duplicate lead IDs from retroactive scanner
  const duplicateLeadIds = useMemo(() => {
    const ids = new Set<string>();
    retroactiveDuplicates.forEach(group => {
      ids.add(group.lead.id);
      group.conflictingLeads.forEach(c => ids.add(c.id));
    });
    return ids;
  }, [retroactiveDuplicates]);

  // Base outreach pool leads:
  // Non-leaders see ONLY leads assigned to them for outreach
  // Team Leader sees all leads assigned for outreach across the entire team
  const baseOutreachLeads = useMemo(() => {
    return leads.filter(l => {
      // Must be an active cadence or completed outreach stage
      const isOutreachStage = l.stage === 'contacted' || l.stage === 'replied' || l.stage === 'all_done';
      if (!isOutreachStage) return false;

      // Regular member only sees their assigned outreach leads
      if (!isTeamLeader && l.current_assignee_id !== currentUser.id) {
        return false;
      }

      // Team Leader member filter
      if (isTeamLeader && selectedMemberFilter !== 'all' && l.current_assignee_id !== selectedMemberFilter) {
        return false;
      }

      return true;
    });
  }, [leads, isTeamLeader, currentUser.id, selectedMemberFilter]);

  // Filtered leads based on cadence step, channel, and search
  const filteredLeads = useMemo(() => {
    return baseOutreachLeads.filter(l => {
      // Channel filter
      if (channelFilter === 'whatsapp' && l.channel !== 'whatsapp') return false;
      if (channelFilter === 'email' && l.channel !== 'email') return false;

      // Cadence Step filter
      if (cadenceFilter !== 'all') {
        if (cadenceFilter === 6) {
          // All done
          if (l.cadence_step < 6 && l.stage !== 'all_done') return false;
        } else {
          if (l.cadence_step !== cadenceFilter) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesComp = (l.company_name || '').toLowerCase().includes(query);
        const matchesCont = (l.contact_name || '').toLowerCase().includes(query);
        const matchesPhone = (l.phone || '').includes(query);
        const matchesEmail = (l.email || '').toLowerCase().includes(query);
        if (!matchesComp && !matchesCont && !matchesPhone && !matchesEmail) return false;
      }

      return true;
    });
  }, [baseOutreachLeads, channelFilter, cadenceFilter, searchQuery]);

  // Step counts for 1-click pills
  const stepCounts = useMemo(() => {
    return {
      all: baseOutreachLeads.length,
      step0: baseOutreachLeads.filter(l => l.cadence_step === 0).length,
      step1: baseOutreachLeads.filter(l => l.cadence_step === 1).length,
      step2: baseOutreachLeads.filter(l => l.cadence_step === 2).length,
      step3: baseOutreachLeads.filter(l => l.cadence_step === 3).length,
      step4: baseOutreachLeads.filter(l => l.cadence_step === 4).length,
      step5: baseOutreachLeads.filter(l => l.cadence_step === 5).length,
      step6: baseOutreachLeads.filter(l => l.cadence_step >= 6 || l.stage === 'all_done').length
    };
  }, [baseOutreachLeads]);

  // Channel live counts
  const whatsappCount = useMemo(() => {
    return baseOutreachLeads.filter(l => l.channel === 'whatsapp').length;
  }, [baseOutreachLeads]);

  const emailCount = useMemo(() => {
    return baseOutreachLeads.filter(l => l.channel === 'email').length;
  }, [baseOutreachLeads]);

  const handleOpenDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDrawerOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>3. OUTREACH POOL</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-950 text-blue-300 border border-blue-800">
                  {baseOutreachLeads.length} Leads
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {isTeamLeader 
                  ? 'টিম লিডার ভিউ: টিমের সকল মেম্বার কে কোন ধাপে মেসেজ ও ফলো-আপ পাঠাচ্ছে তা পর্যবেক্ষণ ও ফিল্টার করুন।' 
                  : 'আপনার আউটরিচ কিউ: টিম লিডার আপনাকে ইমেইল/মেসেজ পাঠানোর জন্য যে লিডগুলো দিয়েছেন তা এখানে ধাপে ধাপে সাজানো রয়েছে।'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/audited-leads"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <span>← 2. Audited Leads</span>
          </Link>

          <button
            onClick={() => setIsFocusModeOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Focus Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Team Leader Member Filter Selector */}
      {isTeamLeader && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300 font-medium">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">মেম্বার অনুযায়ী ফিল্টার করুন (Team Leader Filter):</span>
            <span className="text-slate-400">নির্দিষ্ট কোনো মেম্বারের আউটরিচ প্রগ্রেস দেখতে পারেন:</span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/50 font-bold text-white text-xs focus:outline-none"
            >
              <option value="all">👥 All Team Members ({baseOutreachLeads.length} Active Leads)</option>
              {teamMembers.map(m => {
                const memberLeadCount = leads.filter(l => (l.stage === 'contacted' || l.stage === 'replied' || l.stage === 'all_done') && l.current_assignee_id === m.id).length;
                return (
                  <option key={m.id} value={m.id}>
                    {m.role === 'team_leader' ? '👑' : '👤'} {m.full_name} ({memberLeadCount} leads)
                  </option>
                );
              })}
            </select>

            {selectedMemberFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMemberFilter('all')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Clear Member Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Cadence Step 1-Click Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setCadenceFilter('all')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>All Cadence Steps</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-slate-300 font-mono">
            {stepCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(0)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 0
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
          }`}
        >
          <span>⚡ 1st Message</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-emerald-300 font-mono">
            {stepCounts.step0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(1)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 1
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border border-slate-800'
          }`}
        >
          <span>📨 1st Follow-up</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-cyan-300 font-mono">
            {stepCounts.step1}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(2)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 2
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <span>📨 2nd Follow-up</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-sky-300 font-mono">
            {stepCounts.step2}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(3)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 3
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-indigo-300 border border-slate-800'
          }`}
        >
          <span>📨 3rd Follow-up</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-indigo-300 font-mono">
            {stepCounts.step3}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(4)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 4
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-violet-300 border border-slate-800'
          }`}
        >
          <span>📨 4th Follow-up</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-violet-300 font-mono">
            {stepCounts.step4}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(5)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 5
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-purple-300 border border-slate-800'
          }`}
        >
          <span>📨 5th Follow-up</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-purple-300 font-mono">
            {stepCounts.step5}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCadenceFilter(6)}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            cadenceFilter === 6
              ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/30 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
          }`}
        >
          <span>🎉 5 FU Completed / All Done</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-emerald-300 font-mono">
            {stepCounts.step6}
          </span>
        </button>
      </div>

      {/* 4. Channel Filters, Search & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800">
        
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
            <span>All Channels</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-slate-300 font-mono">
              {baseOutreachLeads.length}
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
            <span>WhatsApp</span>
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
            <span>Email</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-900/60 text-cyan-300 font-mono">
              {emailCount}
            </span>
          </button>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Table / Grid Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Table View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View (Cards)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Grid View</span>
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
      </div>

      {/* 5. Leads Display (Table View / Grid View) */}
      {filteredLeads.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">আউটরিচ পুলে কোনো লিড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isTeamLeader 
              ? 'অডিটেড লিড সেকশন থেকে মেম্বারদের মাঝে লিড এসাইন করুন যাতে সেগুলো আউটরিচ পুলে জমা হয়।' 
              : 'টিম লিডার যখন আপনাকে মেসেজ পাঠানোর জন্য কোনো অডিটেড লিড এসাইন করবেন, তখন সেগুলো এখানে প্রদর্শিত হবে।'}
          </p>
          <Link
            href="/audited-leads"
            className="inline-block px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md mt-2"
          >
            Go to 2. Audited Leads →
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        <LeadTableView
          leads={filteredLeads}
          onOpenDetails={handleOpenDetails}
          duplicateLeadIds={duplicateLeadIds}
        />
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
