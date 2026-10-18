'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Lead, OutreachChannel } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { detectCountryFromPhone, getCountryLocalTime, COUNTRY_CODES } from '@/lib/country-codes';
import { 
  CheckCircle2, 
  Layers, 
  UserCheck, 
  Search, 
  Clock, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  FileText, 
  Zap, 
  ArrowRight, 
  X, 
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  ChevronRight,
  Database
} from 'lucide-react';
import { AssignMemberModal } from '@/components/leads/AssignMemberModal';

export default function AuditedLeadsPage() {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    bulkAssignAuditor,
    passAudit,
    bulkPassAudit,
    assignLead, 
    bulkAssignLead, 
    addActivityNote,
    activities
  } = useApp();

  const [activeTab, setActiveTab] = useState<'under_audit' | 'ready_for_sales'>('under_audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  
  // Sales assignment inputs
  const [bulkSalesMemberId, setBulkSalesMemberId] = useState('');
  const [bulkChannel, setBulkChannel] = useState<OutreachChannel>('whatsapp');
  const [rowSalesChannels, setRowSalesChannels] = useState<Record<string, OutreachChannel>>({});

  // Member modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalMode, setAssignModalMode] = useState<'audit' | 'sales'>('sales');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Note Modal state
  const [noteModalLead, setNoteModalLead] = useState<Lead | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Timeline Modal state
  const [timelineModalLead, setTimelineModalLead] = useState<Lead | null>(null);
  const [timelineQuickNote, setTimelineQuickNote] = useState('');

  // Live clock tick
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset selection when tab switches
  useEffect(() => {
    setSelectedLeadIds(new Set());
    setBulkSalesMemberId('');
  }, [activeTab]);

  // Leads under audit review (assigned to auditor from Lead Store)
  const underAuditLeads = useMemo(() => {
    return leads.filter(l => l.stage === 'audit');
  }, [leads]);

  // Audited leads waiting for Team Leader sales assignment
  const readyForSalesLeads = useMemo(() => {
    return leads.filter(l => l.stage === 'audited');
  }, [leads]);

  // Currently displayed leads based on tab and filters
  const displayedLeads = useMemo(() => {
    const baseList = activeTab === 'under_audit' ? underAuditLeads : readyForSalesLeads;

    return baseList.filter(l => {
      // Channel filter
      if (channelFilter === 'whatsapp' && l.channel !== 'whatsapp') return false;
      if (channelFilter === 'email' && l.channel !== 'email') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesComp = (l.company_name || '').toLowerCase().includes(q);
        const matchesWeb = (l.website || '').toLowerCase().includes(q);
        const matchesContact = (l.contact_name || '').toLowerCase().includes(q);
        const matchesPhone = (l.phone || '').includes(q);
        const matchesEmail = (l.email || '').toLowerCase().includes(q);
        if (!matchesComp && !matchesWeb && !matchesContact && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, underAuditLeads, readyForSalesLeads, channelFilter, searchQuery]);

  // Toggle selection
  const handleToggleSelect = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.size === displayedLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(displayedLeads.map(l => l.id)));
    }
  };

  // Action: Single Auditor marks audit as complete
  const handleSinglePassAudit = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    passAudit(leadId);
    setToastMessage(`✅ "${lead?.company_name || 'Lead'}" এর অডিট সম্পন্ন হয়েছে! লিডটি এখন "Ready for Sales"-এ টিম লিডারের সেলস এসাইনমেন্টের জন্য প্রস্তুত।`);
  };

  // Action: Bulk Auditor marks audit as complete
  const handleBulkPassAudit = () => {
    if (selectedLeadIds.size === 0) return;
    const count = selectedLeadIds.size;
    bulkPassAudit(Array.from(selectedLeadIds));
    setToastMessage(`✅ ${count}টি লিডের অডিট সম্পন্ন হয়েছে এবং "Ready for Sales"-এ স্থানান্তর করা হয়েছে!`);
    setSelectedLeadIds(new Set());
  };

  // Action: Team Leader assigns Audited Lead to a Sales Member for Messaging
  const handleSingleAssignSales = (leadId: string, memberId: string) => {
    if (!memberId) return;
    const member = teamMembers.find(m => m.id === memberId);
    const lead = leads.find(l => l.id === leadId);
    const channel = rowSalesChannels[leadId] || lead?.channel || 'whatsapp';

    assignLead(leadId, memberId, channel);
    setToastMessage(`🚀 "${lead?.company_name || 'Lead'}" সফলভাবে ${member?.full_name}-কে ${channel.toUpperCase()} মেসেজ পাঠানোর জন্য এসাইন করা হয়েছে! মেম্বারের ড্যাশবোর্ডে যুক্ত হয়েছে।`);
  };

  // Action: Team Leader bulk assigns Audited Leads to a Sales Member
  const handleBulkAssignSales = () => {
    if (selectedLeadIds.size === 0 || !bulkSalesMemberId) return;
    const member = teamMembers.find(m => m.id === bulkSalesMemberId);
    const count = selectedLeadIds.size;

    bulkAssignLead(Array.from(selectedLeadIds), bulkSalesMemberId, bulkChannel);
    setToastMessage(`🚀 ${count}টি অডিটকৃত লিড সফলভাবে ${member?.full_name}-কে ${bulkChannel.toUpperCase()} মেসেজিংয়ের জন্য এসাইন করা হয়েছে!`);
    
    setSelectedLeadIds(new Set());
    setBulkSalesMemberId('');
  };

  // Save quick note
  const handleSaveNote = () => {
    if (!noteModalLead || !quickNoteText.trim()) return;
    addActivityNote(noteModalLead.id, quickNoteText.trim(), [], 'note');
    setNoteModalLead(null);
    setQuickNoteText('');
    soundEngine.playSuccessChime();
  };

  // Save timeline note
  const handleSaveTimelineNote = () => {
    if (!timelineModalLead || !timelineQuickNote.trim()) return;
    addActivityNote(timelineModalLead.id, timelineQuickNote.trim(), [], 'note');
    setTimelineQuickNote('');
    soundEngine.playSuccessChime();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-full">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-emerald-900 text-emerald-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>2. AUDITED LEADS (অডিটেড লিড)</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {underAuditLeads.length + readyForSalesLeads.length} Total
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                এখানে অডিটর অডিট শেষ করে <span className="text-emerald-400 font-bold">"Audit Complete"</span> মার্ক করবেন, এবং টিম লিডার সেলস মেম্বারকে ইমেইল/মেসেজ পাঠানোর জন্য নির্ধারণ করবেন।
              </p>
            </div>
          </div>
        </div>

        {/* Top Link back to Lead Store */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link
            href="/lead-store"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>← 1. Lead Store</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Workflow Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tab 1: Under Audit */}
        <button
          type="button"
          onClick={() => setActiveTab('under_audit')}
          className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between ${
            activeTab === 'under_audit'
              ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50 shadow-xl shadow-amber-950/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-sm font-black text-white">১. অডিট প্রক্রিয়াধীন (Under Audit Review)</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              মেম্বারদের অডিটের জন্য এসাইন করা লিড। অডিট শেষ হলে <strong className="text-amber-300">"Audit Complete"</strong> মার্ক করুন।
            </p>
          </div>
          <span className={`text-2xl font-black px-3.5 py-1.5 rounded-xl border ml-3 shrink-0 ${
            activeTab === 'under_audit'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
              : 'bg-slate-950 text-amber-400 border-slate-800'
          }`}>
            {underAuditLeads.length}
          </span>
        </button>

        {/* Tab 2: Ready for Sales Assignment */}
        <button
          type="button"
          onClick={() => setActiveTab('ready_for_sales')}
          className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between ${
            activeTab === 'ready_for_sales'
              ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-xl shadow-emerald-950/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <p className="text-sm font-black text-white">২. অডিট সম্পন্ন - রেডি ফর সেলস (Ready for Sales)</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              অডিট কমপ্লিট লিডসমূহ। টিম লিডার এখান থেকে মেম্বারকে ইমেইল/মেসেজ পাঠানোর জন্য নির্ধারণ করবেন।
            </p>
          </div>
          <span className={`text-2xl font-black px-3.5 py-1.5 rounded-xl border ml-3 shrink-0 ${
            activeTab === 'ready_for_sales'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
              : 'bg-slate-950 text-emerald-400 border-slate-800'
          }`}>
            {readyForSalesLeads.length}
          </span>
        </button>
      </div>

      {/* 3. Filter Bar & Search Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>
            {activeTab === 'under_audit' 
              ? 'অডিটর অডিট রিভিউ করে নিচের বাটনে ক্লিক করে কমপ্লিট করবেন।' 
              : 'টিম লিডার মেম্বার ও মেসেজিং চ্যানেল (WhatsApp/Email) সিলেক্ট করে এসাইন করবেন।'}
          </span>
        </div>

        {/* Channel Filters & Search */}
        <div className="flex items-center space-x-2">
          {/* Channel Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChannelFilter('all')}
              className={`px-2 py-1 rounded-lg font-bold ${
                channelFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('whatsapp')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center space-x-1 ${
                channelFilter === 'whatsapp' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              <span>WA</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('email')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center space-x-1 ${
                channelFilter === 'email' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3 h-3 text-cyan-400" />
              <span>Email</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, phone..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. FLOATING / STICKY BULK ACTIONS BAR */}
      {selectedLeadIds.size > 0 && (
        <div className="sticky top-4 z-30 p-4 rounded-2xl bg-slate-900 border-2 border-emerald-400 text-white shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-top-2">
          
          {/* Top row: Counter, info, channel toggles, and modal launchers */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                {selectedLeadIds.size}
              </div>
              <div>
                <p className="font-black text-xs text-white flex items-center space-x-2">
                  <span>{selectedLeadIds.size}টি লিড সিলেক্ট করা হয়েছে</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    activeTab === 'under_audit'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {activeTab === 'under_audit' ? 'Under Audit' : 'Ready for Sales'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-300">
                  {activeTab === 'under_audit'
                    ? 'অডিট সম্পন্ন মার্ক করুন অথবা অন্য কোনো মেম্বারকে অডিটর হিসেবে নির্ধারণ করুন।'
                    : 'মেম্বারের নামের উপর ক্লিক করে সরাসরি WhatsApp বা Email মেসেজ পাঠানোর দায়িত্ব দিন।'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activeTab === 'under_audit' ? (
                <>
                  {/* Single-click Bulk Pass Audit */}
                  <button
                    type="button"
                    onClick={handleBulkPassAudit}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>✅ এক ক্লিকে অডিট কমপ্লিট করুন</span>
                  </button>

                  {/* Modal Trigger for Audit */}
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalMode('audit');
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/50 font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>👥 অডিটর নির্ধারণ কার্ড</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Channel Toggle */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold space-x-1">
                    <button
                      type="button"
                      onClick={() => setBulkChannel('whatsapp')}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                        bulkChannel === 'whatsapp'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp 💬</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkChannel('email')}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                        bulkChannel === 'email'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email ✉️</span>
                    </button>
                  </div>

                  {/* Modal Trigger for Sales */}
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalMode('sales');
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>👥 সব মেম্বার কার্ড ({teamMembers.length} জন)</span>
                  </button>
                </>
              )}

              {/* Clear selection */}
              <button
                type="button"
                onClick={() => setSelectedLeadIds(new Set())}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Bottom row: Direct 1-Click Team Member Names Chips */}
          <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black shrink-0 mr-1 flex items-center space-x-1 text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {activeTab === 'under_audit'
                  ? '🔄 অডিটর রি-এসাইন করতে মেম্বারের নামের উপর ক্লিক করুন:'
                  : `👉 সেলস মেম্বার নির্বাচন করুন (${bulkChannel.toUpperCase()} মেসেজ):`}
              </span>
            </span>

            {teamMembers.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  const count = selectedLeadIds.size;
                  if (activeTab === 'under_audit') {
                    bulkAssignAuditor(Array.from(selectedLeadIds), m.id);
                    setToastMessage(`🔍 ${count}টি লিড সফলভাবে ${m.full_name}-কে অডিটের জন্য রি-এসাইন করা হয়েছে!`);
                  } else {
                    bulkAssignLead(Array.from(selectedLeadIds), m.id, bulkChannel);
                    setToastMessage(`🚀 ${count}টি অডিটকৃত লিড সফলভাবে ${m.full_name}-কে ${bulkChannel.toUpperCase()} মেসেজ পাঠানোর জন্য হস্তান্তর করা হয়েছে!`);
                  }
                  setSelectedLeadIds(new Set());
                  soundEngine.playSuccessChime();
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 group ${
                  activeTab === 'under_audit'
                    ? 'bg-slate-950 hover:bg-amber-500 text-slate-100 hover:text-slate-950 border-slate-700 hover:border-amber-400'
                    : 'bg-slate-950 hover:bg-emerald-500 text-slate-100 hover:text-slate-950 border-slate-700 hover:border-emerald-400'
                }`}
                title={`${m.full_name} (${m.role}) কে সরাসরি এসাইন করুন`}
              >
                <span className="text-xs">{m.role === 'team_leader' ? '👑' : '👤'}</span>
                <span className="font-extrabold">{m.full_name}</span>
                <span className={`text-[10px] font-mono font-bold ${
                  activeTab === 'under_audit'
                    ? 'text-amber-400 group-hover:text-slate-950'
                    : 'text-emerald-400 group-hover:text-slate-950'
                }`}>
                  ★{m.consecutive_approvals || 0}
                </span>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* 5. Main Audited Leads Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/90 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
              {/* Select All Checkbox */}
              <th className="py-4 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={displayedLeads.length > 0 && selectedLeadIds.size === displayedLeads.length}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  title="Select / Deselect All Visible Leads"
                />
              </th>
              <th className="py-4 px-4">COMPANY & WEBSITE</th>
              <th className="py-4 px-4">COUNTRY & TIME</th>
              <th className="py-4 px-4">CHANNEL CONTACT</th>
              <th className="py-4 px-4">
                {activeTab === 'under_audit' ? 'ASSIGNED AUDITOR' : 'AUDITED BY'}
              </th>
              <th className="py-4 px-5 text-right">
                {activeTab === 'under_audit' ? 'AUDIT ACTION (অডিট সম্পন্ন)' : 'ASSIGN TO SALES MEMBER (মেসেজ পাঠাতে এসাইন)'}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {displayedLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-300">
                      {activeTab === 'under_audit' 
                        ? 'অডিট প্রক্রিয়াধীন কোনো লিড নেই' 
                        : 'রেডি ফর সেলস কিউতে কোনো লিড নেই'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeTab === 'under_audit'
                        ? 'লিড স্টোর থেকে কোনো মেম্বারকে অডিটের জন্য নির্ধারণ করুন।'
                        : 'অডিট রিভিউ সম্পন্ন হলে লিডগুলো এখানে সেলস এসাইনমেন্টের জন্য জমা হবে।'}
                    </p>
                    {activeTab === 'under_audit' && (
                      <Link
                        href="/lead-store"
                        className="inline-block mt-2 px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                      >
                        ← Go to Lead Store
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedLeads.map((lead) => {
                const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null) || COUNTRY_CODES[0];
                const { timeString, isBusinessHours } = mounted 
                  ? getCountryLocalTime(country.code) 
                  : { timeString: '1:34 PM', isBusinessHours: true };

                const isSelected = selectedLeadIds.has(lead.id);
                const auditor = teamMembers.find(m => m.id === (lead.auditor_id || lead.current_assignee_id));
                const auditorApprover = teamMembers.find(m => m.id === lead.approved_by);

                const selectedRowChannel = rowSalesChannels[lead.id] || lead.channel || 'whatsapp';

                const waPitchMessage = `Hi, regarding your brand ${lead.company_name}: We noticed your ads are scaling and prepared a creative inject tear-sheet. Open to a 2-min review?`;
                const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, waPitchMessage) : '#';

                return (
                  <tr 
                    key={lead.id}
                    className={`group hover:bg-slate-900/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-950/30 ring-1 ring-emerald-500/40' : ''
                    }`}
                    onClick={() => handleToggleSelect(lead.id)}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Company & Website */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {lead.company_name}
                          </span>
                        </div>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-400 hover:text-emerald-400 inline-flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[160px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Country & Local Time */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                          {country.flag} {country.name}
                        </span>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{timeString}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isBusinessHours ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        </div>
                      </div>
                    </td>

                    {/* Channel Contact */}
                    <td className="py-4 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                      {lead.phone ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => soundEngine.playMentionChime()}
                          className="inline-flex items-center justify-between space-x-2 px-3 py-1.5 rounded-xl bg-[#081813] border border-emerald-500/40 hover:border-emerald-400 text-xs font-mono font-bold text-emerald-300 transition-all"
                        >
                          <span>{lead.phone}</span>
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                      ) : (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center justify-between space-x-2 px-3 py-1.5 rounded-xl bg-[#091522] border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 transition-all"
                        >
                          <span className="truncate max-w-[130px]">{lead.email}</span>
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        </a>
                      )}
                    </td>

                    {/* Assigned Auditor or Audited By */}
                    <td className="py-4 px-4 align-middle">
                      {activeTab === 'under_audit' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-[10px] text-amber-300">
                            {auditor?.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <span className="font-bold text-amber-300 block">
                              {auditor?.full_name || 'Assigned Auditor'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              🔍 অডিট পর্যালোচনা চলছে
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] text-emerald-300">
                            {auditorApprover?.full_name?.charAt(0) || auditor?.full_name?.charAt(0) || '✓'}
                          </div>
                          <div>
                            <span className="font-bold text-emerald-300 block">
                              {auditorApprover?.full_name || auditor?.full_name || 'Auditor Verified'}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-mono">
                              ✓ Verified Audited
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        
                        {activeTab === 'under_audit' ? (
                          /* TAB 1 ACTION: Auditor clicks "Audit Complete" */
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleSinglePassAudit(lead.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all active:scale-95"
                              title="অডিট সম্পন্ন করুন এবং রেডি ফর সেলস কিউতে পাঠান"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Audit Complete</span>
                            </button>

                            {/* Re-assign auditor modal button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLeadIds(new Set([lead.id]));
                                setAssignModalMode('audit');
                                setIsAssignModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all"
                              title="অডিটর মেম্বার পরিবর্তন করুন"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* TAB 2 ACTION: Team Leader assigns to a Sales Member for Messaging */
                          <div className="flex items-center space-x-1.5">
                            
                            {/* Member Selection Modal Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLeadIds(new Set([lead.id]));
                                setAssignModalMode('sales');
                                setIsAssignModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/50 hover:border-emerald-400 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
                              title="মেম্বারদের নাম ও কার্ড দেখে সেলস মেসেজিংয়ের জন্য এসাইন করুন"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>মেম্বার নির্বাচন</span>
                            </button>

                            {/* Channel Toggle */}
                            <select
                              value={selectedRowChannel}
                              onChange={(e) => {
                                setRowSalesChannels(prev => ({
                                  ...prev,
                                  [lead.id]: e.target.value as OutreachChannel
                                }));
                              }}
                              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold focus:outline-none"
                            >
                              <option value="whatsapp">WA 💬</option>
                              <option value="email">Email ✉️</option>
                            </select>

                            {/* Member Dropdown */}
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSingleAssignSales(lead.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-[11px] font-bold text-slate-300 hover:text-emerald-300 focus:outline-none cursor-pointer transition-all"
                              title="মেসেজ পাঠানোর জন্য সেলস মেম্বার নির্বাচন করুন"
                            >
                              <option value="" disabled>👤 ড্রপডাউন...</option>
                              {teamMembers.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.full_name} ({m.role === 'team_leader' ? 'Leader' : 'Member'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Clock button for timeline */}
                        <button
                          type="button"
                          onClick={() => {
                            setTimelineModalLead(lead);
                            setTimelineQuickNote('');
                          }}
                          className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all"
                          title="View Activity Timeline"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        {/* Add Note Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setNoteModalLead(lead);
                            setQuickNoteText('');
                          }}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                          title="Add Quick Note"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* QUICK NOTE MODAL */}
      {noteModalLead && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setNoteModalLead(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <FileText className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Add Note to Lead</h3>
              </div>
              <button 
                onClick={() => setNoteModalLead(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-xs">
              Lead: <strong className="text-white">{noteModalLead.company_name}</strong>
            </p>

            <textarea
              rows={3}
              autoFocus
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Write note or feedback for this lead..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs focus:outline-none"
            />

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNoteModalLead(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED TIMELINE MODAL */}
      {timelineModalLead && (() => {
        const lead = timelineModalLead;
        const leadActivities = activities
          .filter(a => a.lead_id === lead.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setTimelineModalLead(null)}
          >
            <div 
              className="w-full max-w-2xl bg-slate-900 border border-purple-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {lead.company_name} - Timeline
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Stage: <strong className="text-purple-300 capitalize">{lead.stage.replace('_', ' ')}</strong>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setTimelineModalLead(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Quick Add Note */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200">Post Activity Note</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={timelineQuickNote}
                      onChange={(e) => setTimelineQuickNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTimelineNote()}
                      placeholder="Write a note..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTimelineNote()}
                      disabled={!timelineQuickNote.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                    >
                      Post
                    </button>
                  </div>
                </div>

                {/* Feed */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300">Activity History ({leadActivities.length})</h4>
                  {leadActivities.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">No activity logged yet.</div>
                  ) : (
                    leadActivities.map(act => (
                      <div key={act.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-300">
                            {teamMembers.find(m => m.id === act.author_id)?.full_name || 'System'}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {act.created_at ? act.created_at.slice(0, 16).replace('T', ' ') : 'Just now'}
                          </span>
                        </div>
                        <p className="text-slate-300">{act.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-right">
                <button
                  type="button"
                  onClick={() => setTimelineModalLead(null)}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 8. ASSIGN MEMBER MODAL (All Member Cards with Instant Assignment) */}
      <AssignMemberModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        leadIds={Array.from(selectedLeadIds)}
        mode={assignModalMode}
        onSuccess={(msg) => {
          setToastMessage(msg);
          setSelectedLeadIds(new Set());
          soundEngine.playSuccessChime();
        }}
      />

    </div>
  );
}
