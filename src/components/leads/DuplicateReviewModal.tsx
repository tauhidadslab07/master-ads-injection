'use client';

import React from 'react';
import { useApp } from '@/lib/context/app-context';
import { 
  X, 
  ShieldAlert, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Trash2, 
  Merge,
  ExternalLink
} from 'lucide-react';

interface DuplicateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateReviewModal({ isOpen, onClose }: DuplicateReviewModalProps) {
  const { retroactiveDuplicates, resolveDuplicate, setSelectedLead, setIsLeadDrawerOpen } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-amber-600/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Retroactive Pipeline Duplicate Scanner
              </h2>
              <p className="text-xs text-slate-400">
                Found {retroactiveDuplicates.length} collision group(s) across Phone (E.164), Email, or Company matches
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {retroactiveDuplicates.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Pipeline Clean!</h3>
              <p className="text-xs">No duplicate contacts detected across your active pipeline.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {retroactiveDuplicates.map((group, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-amber-300">
                        Collision Group #{idx + 1}
                      </span>
                      <div className="flex items-center space-x-1">
                        {group.reasons.map((r, rIdx) => (
                          <span key={rIdx} className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50 text-[10px] font-bold">
                            Match: {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Side by side cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Primary Lead */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{group.lead.company_name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {group.lead.stage.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <p>Contact: <strong className="text-slate-200">{group.lead.contact_name}</strong></p>
                        <p>Phone: <strong className="text-slate-200 font-mono">{group.lead.phone}</strong></p>
                        <p>Email: <strong className="text-slate-200 font-mono">{group.lead.email}</strong></p>
                        <p>Hunter: <strong className="text-slate-200">{group.lead.hunter?.full_name}</strong></p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setSelectedLead(group.lead);
                            setIsLeadDrawerOpen(true);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                        >
                          <span>Open in Lead Drawer</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Conflicting Lead(s) */}
                    {group.conflictingLeads.map((cLead) => (
                      <div key={cLead.id} className="p-3.5 rounded-xl bg-slate-900 border border-amber-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-200 text-xs">{cLead.company_name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            {cLead.stage.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-1">
                          <p>Contact: <strong className="text-slate-200">{cLead.contact_name}</strong></p>
                          <p>Phone: <strong className="text-slate-200 font-mono">{cLead.phone}</strong></p>
                          <p>Email: <strong className="text-slate-200 font-mono">{cLead.email}</strong></p>
                          <p>Hunter: <strong className="text-slate-200">{cLead.hunter?.full_name}</strong></p>
                        </div>

                        {/* Resolution Actions */}
                        <div className="pt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              setSelectedLead(cLead);
                              setIsLeadDrawerOpen(true);
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => resolveDuplicate(group.lead.id, cLead.id)}
                            className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-600/70 text-rose-300 font-semibold text-[11px] flex items-center space-x-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Prune Conflicting Lead</span>
                          </button>
                        </div>
                      </div>
                    ))}

                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
