'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead } from '@/types/crm';
import { exportLeadsToCsv, exportLeadsToExcel } from '@/lib/export-utils';
import { soundEngine } from '@/lib/audio-chime';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Layers, 
  CheckCircle2, 
  Users, 
  Database, 
  Sparkles,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react';

interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedExportModal({ isOpen, onClose }: AdvancedExportModalProps) {
  const { leads, teamMembers } = useApp();

  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [reactionFilter, setReactionFilter] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter matching leads
  const matchingLeads = useMemo(() => {
    return leads.filter(l => {
      // 1. Niche Filter
      if (nicheFilter !== 'all') {
        const ln = (l.niche || '').toLowerCase();
        const comp = (l.company_name || '').toLowerCase();
        const web = (l.website || '').toLowerCase();

        if (nicheFilter === 'dtc') {
          const isDtc = ln === 'dtc' || /athletic|nutrition|bio|wear|store|shop|apparel|beauty|fashion/i.test(comp) || /wear|shop|store|brand|bio|health/i.test(web);
          if (!isDtc) return false;
        } else if (nicheFilter === 'saas') {
          const isSaas = ln === 'saas' || /cloud|fintech|security|tech|software|vr|ai|systems|data/i.test(comp) || /cloud|io|net|tech|fin/i.test(web);
          if (!isSaas) return false;
        } else if (nicheFilter === 'agency') {
          const isAgency = !(/athletic|nutrition|bio|wear|store|shop|apparel|beauty|fashion/i.test(comp)) && !(/cloud|fintech|security|tech|software|vr|ai|systems|data/i.test(comp));
          if (!isAgency) return false;
        }
      }

      // 2. Stage Filter
      if (stageFilter !== 'all') {
        if (stageFilter === 'lead_added' && l.stage !== 'lead_added') return false;
        if (stageFilter === 'audit' && l.stage !== 'audit' && l.stage !== 'pending_approval') return false;
        if (stageFilter === 'audited' && l.stage !== 'audited' && !(l.stage === 'approved' && !l.current_assignee_id)) return false;
        if (stageFilter === 'in_cadence') {
          const inCadence = l.stage === 'contacted' || l.stage === 'replied' || (l.cadence_step >= 0 && l.cadence_step <= 5);
          if (!inCadence || l.stage === 'lead_added' || l.stage === 'audit') return false;
        }
        if (stageFilter === 'all_done' && l.stage !== 'all_done' && (l.cadence_step ?? 0) < 6) return false;
        if (stageFilter === 'dnc' && !l.is_dnc) return false;
      }

      // 3. Assignee Filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && l.current_assignee_id) return false;
        if (assigneeFilter !== 'unassigned' && l.current_assignee_id !== assigneeFilter) return false;
      }

      // 4. Reaction Filter
      if (reactionFilter !== 'all') {
        if (reactionFilter === 'interested_replied') {
          if (l.last_client_reaction !== 'interested' && l.last_client_reaction !== 'replied') return false;
        } else if (l.last_client_reaction !== reactionFilter) {
          return false;
        }
      }

      return true;
    });
  }, [leads, nicheFilter, stageFilter, assigneeFilter, reactionFilter]);

  // Aggregate metrics for matching leads
  const totalValue = matchingLeads.reduce((acc, curr) => acc + (curr.deal_value || 0), 0);
  const waCount = matchingLeads.filter(l => l.phone).length;
  const emailOnlyCount = matchingLeads.length - waCount;

  const handleExport = () => {
    if (matchingLeads.length === 0) return;
    setIsExporting(true);
    soundEngine.playSuccessChime();

    const timestamp = new Date().toISOString().slice(0, 10);
    const nicheSlug = nicheFilter !== 'all' ? `_${nicheFilter.toUpperCase()}` : '';
    const stageSlug = stageFilter !== 'all' ? `_${stageFilter.toUpperCase()}` : '';
    const filename = `Master_Ads_Leads${nicheSlug}${stageSlug}_${timestamp}`;

    if (exportFormat === 'xlsx') {
      exportLeadsToExcel(matchingLeads, `${filename}.xlsx`);
    } else {
      exportLeadsToCsv(matchingLeads, `${filename}.csv`);
    }

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                Advanced Leads Bulk Exporter (কাস্টম ফিল্টার এক্সপোর্ট)
              </h2>
              <p className="text-[11px] text-slate-400">
                নিস, ক্যাডেন্স স্টেজ, টিম মেম্বার এবং রেসপন্স অনুযায়ী এক্সেল বা সিএসভিতে ফিল্টার করে ডাউনলোড করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Niche Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>ফিল্টার বাই নিস (Filter by Niche)</span>
              </label>
              <select
                value={nicheFilter}
                onChange={(e) => setNicheFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="all">🌐 All Niches (সকল ক্যাটাগরি)</option>
                <option value="dtc">🛍️ E-Commerce Brands (DTC)</option>
                <option value="saas">💻 B2B SaaS & Tech</option>
                <option value="agency">👔 High-Ticket Coaching & Services</option>
              </select>
            </div>

            {/* 2. Pipeline Stage Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>ক্যাডেন্স স্টেজ (Pipeline Stage)</span>
              </label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="all">⚡ All Pipeline Stages (সকল স্টেজ)</option>
                <option value="lead_added">📥 Lead Store (Raw Unaudited Leads)</option>
                <option value="audit">🔍 In Quality Audit Stage</option>
                <option value="audited">✅ Audited Leads (Ready to Assign)</option>
                <option value="in_cadence">🚀 In Sales Cadence (FU 1 to FU 5)</option>
                <option value="all_done">🎉 All Done (Cadence Completed)</option>
                <option value="dnc">🚫 DNC (Do Not Contact)</option>
              </select>
            </div>

            {/* 3. Assignee Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>সেলস টিম মেম্বার (Assignee)</span>
              </label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="all">👥 All Members (সকল মেম্বার)</option>
                <option value="unassigned">⏳ Unassigned Leads Only</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    👤 {m.full_name} ({m.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Client Reaction Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ক্লায়েন্ট স্ট্যাটাস (Client Reaction)</span>
              </label>
              <select
                value={reactionFilter}
                onChange={(e) => setReactionFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="all">💬 Any Reaction Status</option>
                <option value="interested_replied">🔥 Interested & Replied Only</option>
                <option value="seen">👀 Seen (Seen but no reply)</option>
                <option value="unseen">⏳ Unseen (Not viewed yet)</option>
                <option value="not_interested">❌ Not Interested</option>
                <option value="objection">⚠️ Objection</option>
              </select>
            </div>

          </div>

          {/* Export Format Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <label className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
              এক্সপোর্ট ফাইল ফরম্যাট নির্বাচন করুন (Select Format):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all ${
                  exportFormat === 'xlsx'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <p className="font-black text-xs">Excel Workbook (.xlsx)</p>
                  <p className="text-[10px] text-slate-400">Styled columns & multi-cell support</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all ${
                  exportFormat === 'csv'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/40 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Download className="w-5 h-5 text-cyan-400" />
                <div className="text-left">
                  <p className="font-black text-xs">CSV Spreadsheet (.csv)</p>
                  <p className="text-[10px] text-slate-400">Universal standard format</p>
                </div>
              </button>
            </div>
          </div>

          {/* Live Preview Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Live Filter Results
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                {matchingLeads.length} Matches Found
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Total Value</span>
                <span className="text-sm font-black text-emerald-400">
                  ${totalValue.toLocaleString()}/mo
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">WhatsApp Leads</span>
                <span className="text-sm font-black text-white">{waCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Email Leads</span>
                <span className="text-sm font-black text-white">{emailOnlyCount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={matchingLeads.length === 0 || isExporting}
            className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition-all shadow-xl ${
              matchingLeads.length > 0 && !isExporting
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 shadow-emerald-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>
              {isExporting 
                ? 'Generating File...' 
                : `Download ${matchingLeads.length} Leads (${exportFormat.toUpperCase()})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
