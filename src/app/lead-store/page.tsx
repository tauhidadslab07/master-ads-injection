'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Lead } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { detectCountryFromPhone, getCountryLocalTime, COUNTRY_CODES } from '@/lib/country-codes';
import { 
  Database, 
  Plus, 
  UploadCloud, 
  Search, 
  Filter, 
  MessageSquare, 
  Mail, 
  Clock, 
  Check, 
  ArrowRight, 
  FileText, 
  ExternalLink, 
  ChevronRight,
  Zap,
  UserCheck,
  X,
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  Lock,
  Calendar
} from 'lucide-react';
import { AssignMemberModal } from '@/components/leads/AssignMemberModal';

export default function LeadStorePage() {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    assignAuditor,
    bulkAssignAuditor,
    setIsCreateModalOpen, 
    setIsBatchModalOpen, 
    addActivityNote,
    activities,
    setSelectedLead,
    setIsLeadDrawerOpen
  } = useApp();

  const isTeamLeader = currentUser.role === 'team_leader';

  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkAuditorId, setBulkAuditorId] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
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

  // Lead Store contains raw collected leads ('lead_added') waiting for audit assignment
  // Team Leader sees all raw leads; Members see ONLY their own collected leads
  const storeLeads = useMemo(() => {
    return leads.filter(l => {
      // Must be newly added raw lead
      if (l.stage !== 'lead_added') return false;

      // Regular member only sees leads collected by them
      if (!isTeamLeader && l.original_hunter_id !== currentUser.id) {
        return false;
      }

      // Channel filter
      if (channelFilter === 'whatsapp' && l.channel !== 'whatsapp') return false;
      if (channelFilter === 'email' && l.channel !== 'email') return false;

      // Search query
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
  }, [leads, channelFilter, searchQuery, isTeamLeader, currentUser.id]);

  // Overall counts
  const totalStoreCount = leads.filter(l => l.stage === 'lead_added').length;
  const myStoreCount = leads.filter(l => l.stage === 'lead_added' && l.original_hunter_id === currentUser.id).length;
  const underAuditCount = leads.filter(l => l.stage === 'audit').length;
  const auditPassedCount = leads.filter(l => l.stage === 'audited').length;
  const totalAuditedPool = underAuditCount + auditPassedCount;

  // Toggle single lead selection
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

  // Toggle select all visible
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.size === storeLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(storeLeads.map(l => l.id)));
    }
  };

  // Single Assign for Audit: Immediately moves lead to Audited Lead section!
  const handleSingleAssignAuditor = (leadId: string, auditorId: string) => {
    if (!isTeamLeader) {
      soundEngine.playWarningChime();
      setToastMessage('🔒 শুধুমাত্র টিম লিডার অডিটের জন্য মেম্বার এসাইন করতে পারেন!');
      return;
    }
    if (!auditorId) return;
    const auditor = teamMembers.find(m => m.id === auditorId);
    const lead = leads.find(l => l.id === leadId);
    
    assignAuditor(leadId, auditorId);
    setToastMessage(`🔍 "${lead?.company_name || 'Lead'}" সফলভাবে ${auditor?.full_name}-কে অডিটের জন্য এসাইন করা হয়েছে এবং "2. Audited Lead" সেকশনে পাঠানো হয়েছে!`);
  };

  // Bulk Assign for Audit: Immediately moves selected leads to Audited Lead section!
  const handleBulkAssignAuditor = () => {
    if (!isTeamLeader) {
      soundEngine.playWarningChime();
      setToastMessage('🔒 শুধুমাত্র টিম লিডার অডিটের জন্য মেম্বার এসাইন করতে পারেন!');
      return;
    }
    if (selectedLeadIds.size === 0 || !bulkAuditorId) return;
    const auditor = teamMembers.find(m => m.id === bulkAuditorId);
    const count = selectedLeadIds.size;

    bulkAssignAuditor(Array.from(selectedLeadIds), bulkAuditorId);
    setToastMessage(`🚀 ${count}টি লিড সফলভাবে ${auditor?.full_name}-কে অডিটের জন্য এসাইন করা হয়েছে এবং "2. Audited Lead" সেকশনে পাঠানো হয়েছে!`);
    
    setSelectedLeadIds(new Set());
    setBulkAuditorId('');
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
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-cyan-900 text-cyan-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>1. LEAD STORE</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {isTeamLeader ? `${totalStoreCount} Raw Leads (Team All)` : `${myStoreCount} My Collected Leads`}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {isTeamLeader 
                  ? 'কালেক্ট করা সমস্ত কাঁচা লিড এখানে জমা থাকে। টিম লিডার যেকোনো মেম্বারকে অডিটের জন্য নির্ধারণ (Assign for Audit) করবেন।' 
                  : 'আপনি নিজে যে লিডগুলো সংগ্রহ করেছেন সেগুলোই কেবল এখানে সংগৃহীত তারিখ ও সময়সহ দেখতে পাচ্ছেন।'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Lead</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Bulk Import</span>
          </button>

          <Link
            href="/audited-leads"
            className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs border border-cyan-600/50 flex items-center space-x-1.5 transition-all group"
          >
            <span>2. Audited Leads ({totalAuditedPool})</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Total in Lead Store</p>
          <p className="text-2xl font-black text-white">{totalStoreCount}</p>
          <p className="text-[10px] text-cyan-400 font-medium">📥 Raw collected contacts</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">WhatsApp Leads</p>
          <p className="text-2xl font-black text-emerald-400">
            {storeLeads.filter(l => l.channel === 'whatsapp').length}
          </p>
          <p className="text-[10px] text-emerald-500/80 font-medium">💬 Mobile verified</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Email Leads</p>
          <p className="text-2xl font-black text-blue-400">
            {storeLeads.filter(l => l.channel === 'email').length}
          </p>
          <p className="text-[10px] text-blue-400/80 font-medium">✉️ Business inbox</p>
        </div>

        <Link 
          href="/audited-leads"
          className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/50 hover:bg-emerald-950/50 transition-all space-y-1 group"
        >
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
            <span>Dispatched to Audit</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
          <p className="text-2xl font-black text-emerald-300">{totalAuditedPool}</p>
          <p className="text-[10px] text-emerald-500/90 font-bold">Open Audited Leads Queue →</p>
        </Link>
      </div>

      {/* 3. Filter Bar & Search Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Helper Badge */}
        <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>অডিটের জন্য কোনো মেম্বারকে নির্ধারণ করলেই লিডটি সাথে সাথে <strong>Audited Lead</strong> সেকশনে চলে যাবে।</span>
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

      {/* 4. FLOATING / STICKY BULK ACTIONS BAR (When 1 or more leads are selected) */}
      {selectedLeadIds.size > 0 && (
        <div className="sticky top-4 z-30 p-4 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-white shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-top-2">
          
          {/* Top row: Counter, info, modal launcher and cancel */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                {selectedLeadIds.size}
              </div>
              <div>
                <p className="font-black text-xs text-white flex items-center space-x-2">
                  <span>{selectedLeadIds.size}টি লিড সিলেক্ট করা হয়েছে</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Audit Assignment
                  </span>
                </p>
                <p className="text-[11px] text-cyan-200">
                  {isTeamLeader 
                    ? 'নিচের মেম্বারের নামের উপর ক্লিক করলেই সবগুলো লিড সাথে সাথে অডিটে চলে যাবে।'
                    : '🔒 লিড অডিটের জন্য এসাইন করার ক্ষমতা শুধুমাত্র টিম লিডার (তৌহিদ)-এর রয়েছে। আপনি কেবল লিড দেখতে পারবেন।'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Modal trigger button (Leader only) */}
              {isTeamLeader && (
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>👥 সব মেম্বার কার্ড ({teamMembers.length} জন)</span>
                </button>
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

          {/* Member Names Row: Direct 1-Click Assignment (Leader Only) */}
          {isTeamLeader ? (
            <div className="pt-2.5 border-t border-cyan-800/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black text-amber-300 shrink-0 mr-1 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>সরাসরি মেম্বার নির্বাচন করুন:</span>
              </span>
              {teamMembers.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const count = selectedLeadIds.size;
                    bulkAssignAuditor(Array.from(selectedLeadIds), m.id);
                    setToastMessage(`🔍 ${count}টি লিড সফলভাবে ${m.full_name}-কে অডিটের জন্য এসাইন করা হয়েছে এবং "2. Audited Lead" সেকশনে পাঠানো হয়েছে!`);
                    setSelectedLeadIds(new Set());
                    soundEngine.playSuccessChime();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-amber-500 text-slate-100 hover:text-slate-950 border border-slate-700/80 hover:border-amber-400 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 group"
                  title={`${m.full_name} (${m.role}) কে এসাইন করতে ক্লিক করুন`}
                >
                  <span className="text-xs">{m.role === 'team_leader' ? '👑' : '👤'}</span>
                  <span className="font-extrabold">{m.full_name}</span>
                  <span className="text-[10px] text-amber-400 group-hover:text-slate-950 font-mono font-bold">
                    ★{m.consecutive_approvals || 0}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="pt-2.5 border-t border-cyan-800/60 flex items-center space-x-2 text-xs text-amber-300 font-bold">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>লিড অডিটের জন্য মেম্বারদের নির্ধারণ করার ক্ষমতা শুধুমাত্র টিম লিডারের রয়েছে।</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Stored Leads Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/90 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
              {/* Select All Checkbox */}
              <th className="py-4 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={storeLeads.length > 0 && selectedLeadIds.size === storeLeads.length}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                  title="Select / Deselect All Visible Leads"
                />
              </th>
              <th className="py-4 px-4">COMPANY & WEBSITE</th>
              <th className="py-4 px-4">COLLECTED DATE & TIME</th>
              <th className="py-4 px-4">COUNTRY & TIME</th>
              <th className="py-4 px-4">CHANNEL CONTACT</th>
              <th className="py-4 px-4">COLLECTED BY (HUNTER)</th>
              <th className="py-4 px-5 text-right">ASSIGN AUDITOR (অডিট নির্ধারণ)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {storeLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-300">লিড স্টোরে কোনো পেন্ডিং লিড নেই</p>
                    <p className="text-xs text-slate-500">
                      সকল কালেক্ট করা লিড অডিটের জন্য এসাইন করা হয়ে গেছে। নতুন লিড যুক্ত করতে বা ইমপোর্ট করতে পারেন।
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      + Add New Lead
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              storeLeads.map((lead) => {
                const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null) || COUNTRY_CODES[0];
                const { timeString, isBusinessHours } = mounted 
                  ? getCountryLocalTime(country.code) 
                  : { timeString: '1:34 PM', isBusinessHours: true };

                const isSelected = selectedLeadIds.has(lead.id);
                const hunter = teamMembers.find(m => m.id === lead.original_hunter_id);

                const waPitchMessage = `Hi, regarding your brand ${lead.company_name}: We noticed your ads are scaling and prepared a creative inject tear-sheet. Open to a 2-min review?`;
                const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, waPitchMessage) : '#';

                return (
                  <tr 
                    key={lead.id}
                    className={`group hover:bg-slate-900/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-950/30 ring-1 ring-cyan-500/40' : ''
                    }`}
                    onClick={() => handleToggleSelect(lead.id)}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Company & Website */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {lead.company_name}
                          </span>
                        </div>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-400 hover:text-cyan-400 inline-flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[160px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Collected Date & Time */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono pl-5">
                          {lead.created_at ? new Date(lead.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </td>

                    {/* Country & Local Time */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                          {country.flag} {country.name}
                        </span>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-cyan-400" />
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

                    {/* Hunter */}
                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-cyan-400">
                          {hunter?.full_name?.charAt(0) || 'H'}
                        </div>
                        <span className="font-semibold text-slate-300">
                          {hunter?.full_name || 'Hunter'}
                        </span>
                      </div>
                    </td>

                    {/* Assign Auditor Actions */}
                    <td className="py-4 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        
                        {isTeamLeader ? (
                          <>
                            {/* Member Assign Button (Opens Member Modal with all team member cards) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLeadIds(new Set([lead.id]));
                                setIsAssignModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/50 hover:border-amber-400 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
                              title="মেম্বারদের নাম ও কার্ড দেখে অডিটের জন্য এসাইন করুন"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>মেম্বার নির্বাচন</span>
                            </button>

                            {/* Member Select Dropdown as quick alternative */}
                            <div className="relative">
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleSingleAssignAuditor(lead.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-[11px] font-bold text-slate-300 hover:text-amber-300 focus:outline-none cursor-pointer transition-all"
                                title="অডিট করার জন্য মেম্বার সিলেক্ট করুন"
                              >
                                <option value="" disabled>👤 ড্রপডাউন...</option>
                                {teamMembers.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.full_name} ({m.role === 'team_leader' ? 'Leader' : 'Specialist'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          <span 
                            className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-500 text-[11px] font-bold inline-flex items-center space-x-1.5"
                            title="শুধুমাত্র টিম লিডার অডিটের জন্য এসাইন করতে পারবেন"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>টিম লিডার এসাইন করবেন</span>
                          </span>
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
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
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
        mode="audit"
        onSuccess={(msg) => {
          setToastMessage(msg);
          setSelectedLeadIds(new Set());
          soundEngine.playSuccessChime();
        }}
      />

    </div>
  );
}
