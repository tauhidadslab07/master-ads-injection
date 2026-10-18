'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { exportLeadsToCsv } from '@/lib/export-utils';
import { 
  Search, 
  Layers, 
  Download, 
  FileText, 
  Database, 
  UploadCloud, 
  Plus, 
  Users, 
  LogOut, 
  RotateCw,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldAlert
} from 'lucide-react';

interface TopHeaderProps {
  onOpenCreateModal: () => void;
  onOpenBatchModal: () => void;
  onOpenTeamModal: () => void;
  onOpenDuplicateModal: () => void;
  onOpenNichesModal?: () => void;
}

export function TopHeader({
  onOpenCreateModal,
  onOpenBatchModal,
  onOpenTeamModal,
  onOpenDuplicateModal,
  onOpenNichesModal
}: TopHeaderProps) {
  const { 
    currentUser, 
    setCurrentUser, 
    teamMembers, 
    leads, 
    retroactiveDuplicates, 
    setIsFocusModeOpen,
    selectedNiche,
    setIsNichesModalOpen
  } = useApp();

  const [searchVal, setSearchVal] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const duplicateCount = retroactiveDuplicates.length;
  const isLeader = currentUser.role === 'team_leader';

  const handleExportCsv = () => {
    exportLeadsToCsv(leads, 'Master_Ads_Injection_All_Leads.csv');
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <header className="h-16 w-full bg-slate-950 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
      
      {/* Left: Mobile Brand + Search Input */}
      <div className="flex items-center space-x-3 flex-1 max-w-xs sm:max-w-md">
        {/* Mobile brand mark */}
        <div className="lg:hidden w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Zap className="w-4 h-4 fill-emerald-400 stroke-emerald-950" />
        </div>

        {/* Global Search */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search leads, phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
        </div>
      </div>

      {/* Center: Action Pill Buttons (Matching Nexus Screenshot) */}
      <div className="hidden xl:flex items-center space-x-1.5">
        
        {/* Niches Button (Click to open Ad Niches & Pipeline Segmentation Modal) */}
        <button
          type="button"
          onClick={onOpenNichesModal || (() => setIsNichesModalOpen(true))}
          className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center space-x-1.5 transition-all active:scale-95 ${
            selectedNiche !== 'all'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white'
          }`}
          title="Manage Ad Niches, Filter Conversion Angles & Target Spend"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Niches</span>
          {selectedNiche !== 'all' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        {/* Export CSV */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </button>

        {/* Scripts / Focus Mode */}
        <button
          type="button"
          onClick={() => setIsFocusModeOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scripts</span>
        </button>

        {/* Backup */}
        <button
          type="button"
          onClick={handleSync}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Backup</span>
        </button>

        {/* Bulk Import */}
        <button
          type="button"
          onClick={onOpenBatchModal}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bulk Import</span>
        </button>

        {/* Add Lead (Filled Emerald Button) */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Lead</span>
        </button>

        {/* Team (Maroon/Rose Pill Button) */}
        <button
          type="button"
          onClick={onOpenTeamModal}
          className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-800/80 hover:bg-rose-900/80 text-rose-300 font-bold flex items-center space-x-1.5 transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span>Team</span>
        </button>

      </div>

      {/* Right: User Profile & Refresh Actions */}
      <div className="flex items-center space-x-2">
        
        {/* Mobile + Add Lead button if screen small */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="xl:hidden px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add</span>
        </button>

        {/* Duplicate Badge */}
        {duplicateCount > 0 && (
          <button
            type="button"
            onClick={onOpenDuplicateModal}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[11px] font-bold"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>{duplicateCount} Dups</span>
          </button>
        )}

        {/* Persona Switcher Dropdown */}
        <div className="relative group">
          <div className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors">
            <div className="text-right leading-tight">
              <span className="font-bold text-white text-xs block">
                {currentUser.full_name.split(' ')[0]} ({currentUser.role === 'team_leader' ? 'Super Ad...' : currentUser.role.slice(0, 8)})
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                {isLeader ? 'ADMIN' : currentUser.is_deputy ? 'DEPUTY' : 'HUNTER'}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
              {currentUser.full_name.charAt(0)}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
          </div>

          {/* Switcher Menu */}
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 hidden group-hover:block hover:block z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Switch Active Persona</p>
              <p className="text-[10px] text-slate-500">Test Section Isolation & Leader Gate as different members</p>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {teamMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => setCurrentUser(m)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                    m.id === currentUser.id 
                      ? 'bg-emerald-950/80 border border-emerald-700 text-white font-bold' 
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-200">
                      {m.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-white">{m.full_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{m.role.replace('_', ' ')} {m.is_deputy ? '• Deputy' : ''}</p>
                    </div>
                  </div>
                  {m.id === currentUser.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={handleSync}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Sync & Refresh Data"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

      </div>

    </header>
  );
}
