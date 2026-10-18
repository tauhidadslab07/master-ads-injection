'use client';

import React from 'react';
import { useApp } from '@/lib/context/app-context';
import { 
  Layers, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap, 
  Plus, 
  ExternalLink,
  ShoppingBag,
  Laptop,
  Briefcase,
  Building2,
  Sparkles
} from 'lucide-react';
import { soundEngine } from '@/lib/audio-chime';

interface NichesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal?: () => void;
}

export function NichesModal({ isOpen, onClose, onOpenCreateModal }: NichesModalProps) {
  const { leads, selectedNiche, setSelectedNiche } = useApp();

  if (!isOpen) return null;

  // Calculate leads per niche
  const getNicheLeadCount = (nicheKey: string) => {
    if (nicheKey === 'all') return leads.filter(l => !l.is_dnc).length;
    return leads.filter(l => {
      if (l.is_dnc) return false;
      const ln = (l.niche || '').toLowerCase();
      const comp = (l.company_name || '').toLowerCase();
      const web = (l.website || '').toLowerCase();
      
      if (nicheKey === 'dtc') {
        return ln === 'dtc' || /athletic|nutrition|bio|wear|store|shop|apparel|beauty|fashion/i.test(comp) || /wear|shop|store|brand|bio|health/i.test(web);
      }
      if (nicheKey === 'saas') {
        return ln === 'saas' || /cloud|fintech|security|tech|software|vr|ai|systems|data/i.test(comp) || /cloud|io|net|tech|fin/i.test(web);
      }
      if (nicheKey === 'agency') {
        return ln === 'agency' || /capital|real estate|logistics|defense|media|solar|consulting|coaching/i.test(comp) || /capital|consulting|media|solar/i.test(web);
      }
      return false;
    }).length;
  };

  const niches = [
    {
      id: 'all',
      name: 'All Ad Niches (Full Database)',
      categoryTag: 'Universal CRM View',
      icon: Layers,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
      activeRing: 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500',
      dealSize: '$15,000 – $60,000',
      targetSpend: '$20k – $200k+/mo',
      summary: 'Complete outreach directory across all eCommerce brands, SaaS software, and service companies.',
      pitchAngle: 'Comprehensive Meta/TikTok creative injection and competitor audit.'
    },
    {
      id: 'dtc',
      name: 'E-Commerce Brands (DTC)',
      categoryTag: 'High-Volume Meta & TikTok',
      icon: ShoppingBag,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300',
      activeRing: 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500',
      dealSize: '$15,000 – $38,000',
      targetSpend: '$25k – $150k+/mo',
      summary: 'Direct-to-consumer apparel, supplements, cosmetics, and jewelry scaling ad spend on Facebook, Instagram & TikTok.',
      pitchAngle: 'UGC hook variation testing, creative fatigue teardown & ROAS stabilization.'
    },
    {
      id: 'saas',
      name: 'B2B SaaS & Tech Platforms',
      categoryTag: 'High LTV Enterprise Pipeline',
      icon: Laptop,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-300',
      activeRing: 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500',
      dealSize: '$30,000 – $75,000',
      targetSpend: '$30k – $200k+/mo',
      summary: 'Cloud software, security solutions, developer tools, and fintech platforms needing pipeline demand generation.',
      pitchAngle: 'Pipeline leak audit, competitor ad creative injection & booked demo funnels.'
    },
    {
      id: 'agency',
      name: 'High-Ticket Coaching & Services',
      categoryTag: 'Direct WhatsApp Close',
      icon: Briefcase,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300',
      activeRing: 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500',
      dealSize: '$20,000 – $60,000',
      targetSpend: '$15k – $80k+/mo',
      summary: 'Consultancies, wealth management, real estate acquisitions, and coaching firms requiring high-ticket clients.',
      pitchAngle: 'VSL lead magnet injection, automated WhatsApp qualification & closer calendars.'
    }
  ];

  const handleSelectNiche = (nicheId: string) => {
    setSelectedNiche(nicheId);
    soundEngine.playSuccessChime();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Ad Niches & Pipeline Segmentation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                  4 Active Niches
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Click any niche to filter CRM leads, view pitch angles, and inspect conversion metrics
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {niches.map((niche) => {
              const Icon = niche.icon;
              const count = getNicheLeadCount(niche.id);
              const isSelected = selectedNiche === niche.id;

              return (
                <div
                  key={niche.id}
                  onClick={() => handleSelectNiche(niche.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? niche.activeRing
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top title and badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${niche.color} border`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                            {niche.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {niche.categoryTag}
                          </span>
                        </div>
                      </div>

                      {/* Count badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                          : 'bg-slate-900 text-emerald-400 border-emerald-800/60'
                      }`}>
                        {count} Leads
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {niche.summary}
                    </p>

                    {/* Deal Value & Pitch Box */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span>Typical Deal:</span>
                        </span>
                        <strong className="text-slate-200 font-mono">{niche.dealSize}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-cyan-400" />
                          <span>Target Ad Spend:</span>
                        </span>
                        <strong className="text-slate-200 font-mono">{niche.targetSpend}</strong>
                      </div>
                      <div className="pt-1 border-t border-slate-800 text-[10px] text-emerald-300/90 leading-tight">
                        <strong className="text-emerald-200">Angle:</strong> {niche.pitchAngle}
                      </div>
                    </div>
                  </div>

                  {/* Bottom selection button */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {isSelected ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Filter</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors">
                        Click to Filter Leads →
                      </span>
                    )}

                    {onOpenCreateModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onOpenCreateModal();
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white font-bold flex items-center space-x-1 transition-colors"
                        title="Add new lead in this niche"
                      >
                        <Plus className="w-3 h-3 text-cyan-400" />
                        <span>Add Lead</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/70 text-xs">
          <span className="text-slate-400">
            Selected Niche: <strong className="text-white uppercase">{selectedNiche}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
