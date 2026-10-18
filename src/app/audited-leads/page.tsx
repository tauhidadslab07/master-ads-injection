'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Lead } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { detectCountryFromPhone, getCountryLocalTime, COUNTRY_CODES } from '@/lib/country-codes';
import { 
  CheckCircle2, 
  Layers, 
  UserCheck, 
  Search, 
  ChevronDown, 
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
  Check
} from 'lucide-react';

export default function AuditedLeadsPage() {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    assignLead, 
    bulkAssignLead, 
    addActivityNote,
    activities
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'unassigned' | string>('all');
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

  // Audited leads: all leads that have completed quality audit
  const auditedLeads = useMemo(() => {
    return leads.filter(l => {
      // Must be audited or approved
      const isAudited = l.stage === 'audited' || (l.stage === 'approved' && !l.current_assignee_id);
      if (!isAudited) return false;

      // Filter by assignee
      if (filterAssignee === 'unassigned' && l.current_assignee_id) return false;
      if (filterAssignee !== 'all' && filterAssignee !== 'unassigned' && l.current_assignee_id !== filterAssignee) {
        return false;
      }

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
  }, [leads, filterAssignee, searchQuery]);

  // Overall counts
  const totalAudited = leads.filter(l => l.stage === 'audited' || (l.stage === 'approved' && !l.current_assignee_id)).length;
  const unassignedCount = leads.filter(l => l.stage === 'audited' && !l.current_assignee_id).length;
  const totalInCadence = leads.filter(l => l.stage === 'contacted' || l.stage === 'replied').length;

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
    if (selectedLeadIds.size === auditedLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(auditedLeads.map(l => l.id)));
    }
  };

  // Bulk Assign to Sales Member
  const handleBulkAssign = () => {
    if (selectedLeadIds.size === 0 || !bulkAssigneeId) return;
    const member = teamMembers.find(m => m.id === bulkAssigneeId);
    bulkAssignLead(Array.from(selectedLeadIds), bulkAssigneeId);
    
    setToastMessage(`🚀 ${selectedLeadIds.size}টি লিড সফলভাবে ${member?.full_name}-কে অ্যাসাইন করা হয়েছে! এখন ${member?.full_name}-এর Today's Work ড্যাশবোর্ডে লাইভ দেখতে পাবেন।`);
    setSelectedLeadIds(new Set());
    setBulkAssigneeId('');
  };

  // Single Assign to Sales Member
  const handleSingleAssign = (leadId: string, memberId: string) => {
    if (!memberId) return;
    const member = teamMembers.find(m => m.id === memberId);
    assignLead(leadId, memberId);
    setToastMessage(`🎯 লিডটি সফলভাবে ${member?.full_name}-কে অ্যাসাইন করা হয়েছে! এখন ${member?.full_name}-এর Today's Work ড্যাশবোর্ডে লাইভ দেখতে পাবেন।`);
  };

  // Quick note save
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
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  Audited Lead (অডিটেড লিড)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  {totalAudited} Leads Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                কোয়ালিটি অডিট সম্পন্ন হয়েছে। টিম লিডার এখান থেকে সেলস টিমের মেম্বারদের কাছে লিড অ্যাসাইন করবেন।
              </p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/lead-store"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <span>← Lead Store</span>
          </Link>

          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <span>Today's Work (ড্যাশবোর্ড)</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Total Audited</p>
          <p className="text-2xl font-black text-emerald-400">{totalAudited}</p>
          <p className="text-[10px] text-emerald-500/80 font-medium">✅ Verified quality</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Unassigned</p>
          <p className="text-2xl font-black text-amber-400">{unassignedCount}</p>
          <p className="text-[10px] text-amber-500/80 font-medium">Awaiting Sales Team</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Active in Cadence</p>
          <p className="text-2xl font-black text-cyan-400">{totalInCadence}</p>
          <p className="text-[10px] text-cyan-400/80 font-medium">In Today's Work queues</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400">Sales Members</p>
          <p className="text-2xl font-black text-white">{teamMembers.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Ready to receive leads</p>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Filter by Assignee */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Filter:</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Audited Leads ({totalAudited})</option>
            <option value="unassigned">⏳ Unassigned Leads ({unassignedCount})</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>
                👤 {m.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, phone..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* 4. FLOATING / STICKY BULK ASSIGN BAR (When 1 or more leads are selected) */}
      {selectedLeadIds.size > 0 && (
        <div className="sticky top-4 z-30 p-3.5 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-white shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              {selectedLeadIds.size}
            </div>
            <div>
              <p className="font-bold text-xs">
                {selectedLeadIds.size} Audited Lead(s) Selected
              </p>
              <p className="text-[10px] text-emerald-200">
                একসাথে সিলেক্ট করা লিডগুলো যেকোনো সেলস টিম মেম্বারকে অ্যাসাইন করুন।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sales Member Selector */}
            <div className="relative">
              <select
                value={bulkAssigneeId}
                onChange={(e) => setBulkAssigneeId(e.target.value)}
                className="px-3 py-1.5 pr-8 rounded-xl bg-slate-900 border border-emerald-500 text-xs font-bold text-white focus:outline-none"
              >
                <option value="">👤 Select Sales Member...</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Assign Button */}
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={!bulkAssigneeId}
              className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-black text-xs shadow-md shadow-emerald-400/20 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <span>🚀 Assign to Sales Member</span>
            </button>

            {/* Deselect All */}
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

      {/* 5. Audited Leads Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/90 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
              {/* Select All Checkbox */}
              <th className="py-4 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={auditedLeads.length > 0 && selectedLeadIds.size === auditedLeads.length}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  title="Select / Deselect All Audited Leads"
                />
              </th>
              <th className="py-4 px-4">COMPANY & CONTACT</th>
              <th className="py-4 px-4">AUDIT STATUS</th>
              <th className="py-4 px-4">CHANNEL CONTACT</th>
              <th className="py-4 px-4">ASSIGN TO SALES MEMBER</th>
              <th className="py-4 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {auditedLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-300">No Audited Leads Available</p>
                    <p className="text-xs text-slate-500">
                      Go to the Lead Store to inspect raw leads and mark them as audit completed.
                    </p>
                    <Link
                      href="/lead-store"
                      className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      ← Go to Lead Store
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              auditedLeads.map((lead) => {
                const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null) || COUNTRY_CODES[0];
                const { timeString, isBusinessHours } = mounted 
                  ? getCountryLocalTime(country.code) 
                  : { timeString: '1:34 PM', isBusinessHours: true };

                const isSelected = selectedLeadIds.has(lead.id);
                const hunter = teamMembers.find(m => m.id === lead.original_hunter_id);
                const assignee = teamMembers.find(m => m.id === lead.current_assignee_id);

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

                    {/* Company & Contact */}
                    <td className="py-4 px-4 align-middle max-w-[240px]">
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
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
                          <span>👤 Contact: {lead.contact_name || 'Owner'}</span>
                          <span>•</span>
                          <span>Hunter: {hunter?.full_name || 'Direct'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Audit Details */}
                    <td className="py-4 px-4 align-middle">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Audit Passed</span>
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono">
                          <span>🗓️</span>
                          <span>{lead.approved_at ? lead.approved_at.slice(0, 10) : '2026-10-18'}</span>
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

                    {/* Assign to Sales Member Dropdown */}
                    <td className="py-4 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        <div className="relative">
                          <select
                            value={lead.current_assignee_id || ''}
                            onChange={(e) => handleSingleAssign(lead.id, e.target.value)}
                            className={`w-full px-2.5 py-1.5 pr-7 rounded-xl text-xs font-bold appearance-none focus:outline-none transition-all cursor-pointer ${
                              !lead.current_assignee_id
                                ? 'bg-amber-950/80 border-2 border-amber-500 text-amber-200 ring-2 ring-amber-500/30'
                                : 'bg-slate-900 border border-slate-700 text-emerald-300'
                            }`}
                          >
                            <option value="">👤 Select Member to Assign...</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} ({m.role.replace('_', ' ')})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {assignee ? (
                          <div className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1 pl-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Live in {assignee.full_name}'s queue</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold pl-1">
                            ⏳ Waiting for TL assignment
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
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

                        {/* Note Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setNoteModalLead(lead);
                            setQuickNoteText('');
                          }}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                          title="Add Note"
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
                <h3 className="text-sm font-bold text-white">Add Note to Audited Lead</h3>
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
              placeholder="Write note or sales instructions for the assigned member..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs focus:outline-none"
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
                      Stage: <strong className="text-emerald-300">Audited Lead</strong>
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
                      placeholder="Write an instruction or update..."
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
