'use client';

import React from 'react';
import { Lead, CADENCE_STEPS } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { 
  Building2, 
  User, 
  MessageCircle, 
  Mail, 
  Lock, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onOpenDetails: (lead: Lead) => void;
  showHunterBadge?: boolean;
  isDuplicateFlagged?: boolean;
}

export function LeadCard({
  lead,
  onOpenDetails,
  showHunterBadge = false,
  isDuplicateFlagged = false
}: LeadCardProps) {
  const isDnc = lead.is_dnc;
  const hunterWaUrl = lead.hunter?.phone ? getWhatsAppUrl(lead.hunter.phone, `Hi ${lead.hunter.full_name}, regarding lead ${lead.company_name}: `) : '#';

  const cadenceInfo = CADENCE_STEPS[lead.cadence_step];

  return (
    <div 
      onClick={() => onOpenDetails(lead)}
      className={`group relative p-4 rounded-2xl bg-slate-900/90 border transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 ${
        isDnc 
          ? 'border-rose-900/50 bg-rose-950/10 hover:border-rose-700/80' 
          : isDuplicateFlagged
          ? 'border-amber-500/70 bg-amber-950/10 hover:border-amber-400'
          : lead.stage === 'closed_won'
          ? 'border-emerald-500/60 bg-emerald-950/10 hover:border-emerald-400'
          : 'border-slate-800/90 hover:border-cyan-500/60 hover:shadow-cyan-950/20'
      }`}
    >
      {/* Top Bar: Channel Icon & Stage Badge */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-1.5">
          {lead.channel === 'whatsapp' ? (
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center space-x-1 border border-emerald-500/30">
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </span>
          ) : (
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold flex items-center space-x-1 border border-cyan-500/30">
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </span>
          )}

          {isDuplicateFlagged && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center space-x-0.5">
              <span>⚠️ Duplicate</span>
            </span>
          )}

          {lead.is_audit_sample && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-600/50">
              🎲 10% Audit
            </span>
          )}
        </div>

        {/* Stage Pill */}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          lead.stage === 'closed_won'
            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
            : lead.stage === 'pending_approval'
            ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
            : lead.stage === 'audit'
            ? 'bg-purple-950 text-purple-300 border-purple-700'
            : lead.stage === 'replied'
            ? 'bg-blue-950 text-blue-300 border-blue-700'
            : lead.stage === 'cold'
            ? 'bg-slate-800 text-slate-400 border-slate-700'
            : lead.stage === 'recycle_pool'
            ? 'bg-sky-950 text-sky-300 border-sky-700'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          {lead.stage.replace('_', ' ')}
        </span>
      </div>

      {/* Main Info */}
      <div className="space-y-1 mb-3">
        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {lead.company_name}
        </h4>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="line-clamp-1">{lead.contact_name}</span>
          <span className="font-bold text-emerald-400 shrink-0">
            ${lead.deal_value?.toLocaleString()}/mo
          </span>
        </div>
      </div>

      {/* DNC Hard-Lock Red Banner */}
      {isDnc && (
        <div className="mb-2.5 p-1.5 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-300 text-[10px] font-bold flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>🚫 DO NOT CONTACT HARD-LOCK</span>
        </div>
      )}

      {/* Cadence Step Badge */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Cadence: <strong>{cadenceInfo?.dayLabel || 'Day 0'}</strong></span>
        </span>
        <span className="text-[10px] uppercase font-semibold text-slate-500">
          [{lead.last_client_reaction}]
        </span>
      </div>

      {/* MANDATORY PERMANENT HUNTER ATTRIBUTION BADGE (Especially in /sales-pipeline) */}
      {showHunterBadge && lead.hunter && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="mt-3 p-2 rounded-xl bg-slate-950 border border-cyan-800/50 flex items-center justify-between text-[11px]"
        >
          <div className="flex items-center space-x-1.5 truncate">
            <span className="text-cyan-400 font-bold">👤 Collected By:</span>
            <span className="font-semibold text-slate-200 truncate">{lead.hunter.full_name}</span>
          </div>

          <a
            href={hunterWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-600/50 transition-colors"
            title={`WhatsApp Hunter: ${lead.hunter.phone}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

    </div>
  );
}
