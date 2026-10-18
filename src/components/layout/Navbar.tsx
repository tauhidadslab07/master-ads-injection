'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context/app-context';
import { 
  Users, 
  Plus, 
  UploadCloud, 
  Zap, 
  ShieldAlert, 
  Calendar, 
  CheckCircle2, 
  PhoneCall, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Target
} from 'lucide-react';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenBatchModal: () => void;
  onOpenTeamModal: () => void;
  onOpenDuplicateModal: () => void;
}

export function Navbar({
  onOpenCreateModal,
  onOpenBatchModal,
  onOpenTeamModal,
  onOpenDuplicateModal
}: NavbarProps) {
  const pathname = usePathname();
  const { 
    currentUser, 
    setCurrentUser, 
    teamMembers, 
    retroactiveDuplicates, 
    setIsFocusModeOpen,
    simulateEndOfMonth,
    setSimulateEndOfMonth
  } = useApp();

  const isLeader = currentUser.role === 'team_leader';
  const isDeputy = currentUser.is_deputy;
  const isHunter = currentUser.role === 'hunter' || currentUser.role === 'outreach_specialist';
  const isCloser = currentUser.role === 'sales_closer';

  const duplicateCount = retroactiveDuplicates.length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-emerald-500 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">
                    MASTER ADS INJECTION
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                    v2.4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 tracking-tight -mt-0.5">
                  Enterprise Ads Outreach, Auditing & Sales Pipeline Hub
                </p>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (With Role Visibility indicators) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl">
            {/* Today's Work Link */}
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                pathname === '/'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Today's Outreach Work & Follow-up Action Queues"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Today&apos;s Work</span>
            </Link>

            {/* Outreach Pool Link */}
            <Link
              href="/outreach-pool"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                pathname === '/outreach-pool'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              } ${isCloser && !isLeader ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={isCloser && !isLeader ? 'Sales Closers cannot access Outreach Pool (Route Protected)' : 'Outreach Pool (Hunters & Outreach Reps)'}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Outreach Pool</span>
              {isHunter && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </Link>

            {/* Sales Pipeline Link */}
            <Link
              href="/sales-pipeline"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                pathname === '/sales-pipeline'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              } ${isHunter && !isLeader ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={isHunter && !isLeader ? 'Hunters cannot access Sales Pipeline (Route Protected)' : 'Sales Pipeline (Closers & Leaders)'}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span>Sales Pipeline</span>
              {isCloser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </Link>
          </nav>

          {/* Right Action Icons & User Switcher */}
          <div className="flex items-center space-x-2">
            
            {/* Retroactive Duplicate Alert Button */}
            {duplicateCount > 0 && (
              <button
                onClick={onOpenDuplicateModal}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-300 hover:bg-amber-900/60 text-xs font-semibold animate-pulse transition-colors"
                title="View detected pipeline duplicates"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>⚠️ {duplicateCount} Dups</span>
              </button>
            )}

            {/* Outreach Focus Mode */}
            <button
              onClick={() => setIsFocusModeOpen(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs font-semibold transition-all"
              title="Launch distraction-free Outreach Focus Mode"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Focus Mode</span>
            </button>

            {/* Batch Import */}
            <button
              onClick={onOpenBatchModal}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-medium transition-colors"
              title="Bulk Excel / CSV Lead Importer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
              <span>Import</span>
            </button>

            {/* New Lead Modal Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span className="hidden xs:inline">New Lead</span>
            </button>

            {/* Team Roster & Deputies (Visible to Leader or any curious tester) */}
            <button
              onClick={onOpenTeamModal}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Manage Team, Deputies & Emergency Reassignment"
            >
              <Users className="w-4 h-4 text-cyan-400" />
            </button>

            {/* End of month simulator toggle */}
            <button
              onClick={() => setSimulateEndOfMonth(!simulateEndOfMonth)}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                simulateEndOfMonth 
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle End-of-Month Close Simulation Banner"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* Active User / Role Switcher Persona */}
            <div className="relative group">
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800 cursor-pointer">
                <div className="relative">
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-cyan-400 transition-colors"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 border border-slate-700">
                      {currentUser.full_name.charAt(0)}
                    </div>
                  )}
                  {currentUser.is_deputy && (
                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-amber-500 text-black font-black px-1 rounded-full border border-slate-950">
                      D
                    </span>
                  )}
                </div>

                <div className="hidden xl:block text-left leading-tight">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-slate-200">
                      {currentUser.full_name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                  </div>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                    {currentUser.role === 'team_leader' ? '👑 Leader' :
                     currentUser.is_deputy ? '🛡️ Deputy' :
                     currentUser.role === 'hunter' ? '🎯 Hunter' :
                     currentUser.role === 'outreach_specialist' ? '💬 Outreach' : '💼 Closer'}
                  </span>
                </div>
              </div>

              {/* Persona Switcher Dropdown */}
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 hidden group-hover:block hover:block z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Active Persona</p>
                  <p className="text-[10px] text-slate-500">Test Section Isolation & Leader Gate as different members</p>
                </div>

                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {teamMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setCurrentUser(m)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        m.id === currentUser.id 
                          ? 'bg-cyan-950/80 border border-cyan-700 text-white' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-200 border border-slate-700">
                          {m.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{m.full_name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {m.role.replace('_', ' ')} {m.is_deputy ? '• Deputy' : ''}
                            {m.is_trusted_hunter ? ' • ⭐ Trusted' : ''}
                          </p>
                        </div>
                      </div>
                      {m.id === currentUser.id && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
