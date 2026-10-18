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
  CheckCircle2, 
  Search, 
  Filter, 
  MessageSquare, 
  Mail, 
  Clock, 
  Check, 
  ArrowRight, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  ChevronRight,
  Zap,
  RotateCcw,
  UserCheck,
  X,
  Send
} from 'lucide-react';

export default function LeadStorePage() {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    sendToAudit, 
    passAudit, 
    bulkSendToAudit, 
    bulkPassAudit, 
    setIsCreateModalOpen, 
    setIsBatchModalOpen, 
    addActivityNote,
    activities,
    setSelectedLead,
    setIsLeadDrawerOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'raw' | 'in_audit'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

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

  // Filter leads in Lead Store:
  // Lead Store contains leads that are newly added ('lead_added') or currently undergoing audit ('audit' / 'pending_approval')
  const storeLeads = useMemo(() => {
    return leads.filter(l => {
      // Must be in lead store stages
      const isInStore = l.stage === 'lead_added' || l.stage === 'audit' || l.stage === 'pending_approval';
      if (!isInStore) return false;

      // Tab filter
      if (activeTab === 'raw' && l.stage !== 'lead_added') return false;
      if (activeTab === 'in_audit' && l.stage !== 'audit' && l.stage !== 'pending_approval') return false;

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
  }, [leads, activeTab, channelFilter, searchQuery]);

  // Overall counts
  const totalStoreCount = leads.filter(l => l.stage === 'lead_added' || l.stage === 'audit' || l.stage === 'pending_approval').length;
  const rawCount = leads.filter(l => l.stage === 'lead_added').length;
  const inAuditCount = leads.filter(l => l.stage === 'audit' || l.stage === 'pending_approval').length;
  const auditedCount = leads.filter(l => l.stage === 'audited').length;

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

  // Bulk Assign for Audit
  const handleBulkSendToAudit = () => {
    if (selectedLeadIds.size === 0) return;
    bulkSendToAudit(Array.from(selectedLeadIds));
    setSelectedLeadIds(new Set());
  };

  // Bulk Audit Complete (Moves to Audited Lead)
  const handleBulkPassAudit = () => {
    if (selectedLeadIds.size === 0) return;
    bulkPassAudit(Array.from(selectedLeadIds));
    setSelectedLeadIds(new Set());
  };

  // Quick single note save
  const handleSaveNote = () => {
    if (!noteModalLead || !quickNoteText.trim()) return;
    addActivityNote(noteModalLead.id, quickNoteText.trim(), [], 'note');
    setQuickNoteText('');
    setNoteModalLead(null);
    soundEngine.playMentionChime();
  };

  // Timeline note save
  const handleSaveTimelineNote = (chipText?: string) => {
    const textToSave = chipText || timelineQuickNote;
    if (!timelineModalLead || !textToSave.trim()) return;
    addActivityNote(timelineModalLead.id, textToSave.trim(), [], 'note');
    if (!chipText) setTimelineQuickNote('');
    soundEngine.playMentionChime();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header Banner & Action Bar */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  Lead Store (লিড স্টোর)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                  {totalStoreCount} Leads
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সকল কালেক্ট হওয়া লিড এখানে জমা থাকে। লিডার এক বা একাধিক লিড সিলেক্ট করে অডিটের জন্য পাঠাতে পারেন।
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add / Upload & Audited Lead Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Lead</span>
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
            className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs border border-cyan-600/50 flex items-center space-x-1.5 transition-all"
          >
            <span>Audited Leads ({auditedCount})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Total in Store</p>
          <p className="text-2xl font-black text-white">{totalStoreCount}</p>
          <p className="text-[10px] text-cyan-400 font-medium">📥 Stored contacts</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Raw / Unassigned</p>
          <p className="text-2xl font-black text-blue-400">{rawCount}</p>
          <p className="text-[10px] text-slate-500 font-medium">Ready for audit</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Under Audit Review</p>
          <p className="text-2xl font-black text-amber-400">{inAuditCount}</p>
          <p className="text-[10px] text-amber-500/80 font-medium">🔍 Being inspected</p>
        </div>

        <Link 
          href="/audited-leads"
          className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/50 hover:bg-emerald-950/50 transition-all space-y-1 group"
        >
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
            <span>Audit Passed</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
          <p className="text-2xl font-black text-emerald-300">{auditedCount}</p>
          <p className="text-[10px] text-emerald-500/90 font-bold">Ready for Sales Assignment →</p>
        </Link>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Stage Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Stored ({totalStoreCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'raw'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            📥 Raw Leads ({rawCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('in_audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'in_audit'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            🔍 In Audit Review ({inAuditCount})
          </button>
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
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-white shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-xs">
              {selectedLeadIds.size}
            </div>
            <div>
              <p className="font-bold text-xs">
                {selectedLeadIds.size} Lead(s) Selected
              </p>
              <p className="text-[10px] text-cyan-200">
                এক বা একাধিক লিড একসাথে অডিটে পাঠান অথবা অডিট কমপ্লিট করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Button: Send Selected to Audit */}
            <button
              type="button"
              onClick={handleBulkSendToAudit}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <span>🔍 Assign for Audit</span>
            </button>

            {/* Button: Complete Audit & Move to Audited Leads */}
            <button
              type="button"
              onClick={handleBulkPassAudit}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>✅ Complete Audit (Move to Audited)</span>
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={() => setSelectedLeadIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 5. Stored Leads Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
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
              <th className="py-4 px-4">COUNTRY & TIME</th>
              <th className="py-4 px-4">CHANNEL CONTACT</th>
              <th className="py-4 px-4">STORE STAGE</th>
              <th className="py-4 px-5 text-right">AUDIT ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {storeLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-300">No leads in this Store queue</p>
                    <p className="text-xs text-slate-500">
                      Upload or add leads to populate the Lead Store, then assign them for audit.
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
                    <td className="py-4 px-4 align-middle max-w-[240px]">
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {lead.company_name}
                        </div>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono flex items-center space-x-1"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 pt-0.5 font-medium">
                          <span>👤 Hunter: {hunter?.full_name || 'Direct'}</span>
                          <span>•</span>
                          <span>{lead.created_at ? lead.created_at.slice(0, 10) : '2026-10-18'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Country & Time */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#0a1f18] border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                          <span>{country.code}</span>
                          <span>{country.name}</span>
                        </div>
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#081f26] border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-semibold">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{timeString}</span>
                          <span 
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isBusinessHours ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
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

                    {/* Store Stage Badge */}
                    <td className="py-4 px-4 align-middle">
                      {lead.stage === 'audit' || lead.stage === 'pending_approval' ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 border border-amber-500/60 text-amber-300 animate-pulse">
                          🔍 Under Audit
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-950 border border-blue-500/60 text-blue-300">
                          📥 Raw Stored
                        </span>
                      )}
                    </td>

                    {/* Actions: Send to Audit or Pass Audit */}
                    <td className="py-4 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        {lead.stage === 'lead_added' ? (
                          <button
                            type="button"
                            onClick={() => sendToAudit(lead.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center space-x-1 transition-all active:scale-95"
                            title="Assign this lead for quality audit"
                          >
                            <span>🔍 Send to Audit</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => passAudit(lead.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1 transition-all active:scale-95"
                            title="Audit Complete: Move to Audited Leads for Team Leader assignment"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Audit Complete</span>
                          </button>
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

    </div>
  );
}
