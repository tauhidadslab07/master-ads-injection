'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context/app-context';
import { Zap, Layers, Plus, Users, Target } from 'lucide-react';

interface MobileNavProps {
  onOpenCreateModal: () => void;
  onOpenTeamModal: () => void;
}

export function MobileNav({ onOpenCreateModal, onOpenTeamModal }: MobileNavProps) {
  const pathname = usePathname();
  const { setIsFocusModeOpen } = useApp();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        
        {/* Today's Work */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === '/' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span>Work</span>
        </Link>

        {/* Outreach Pool */}
        <Link
          href="/outreach-pool"
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === '/outreach-pool' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span>Outreach</span>
        </Link>

        {/* Floating Center Action Button (+ New Lead) */}
        <button
          onClick={onOpenCreateModal}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Add New Lead"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-slate-950 font-black active:scale-90 transition-transform">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold text-cyan-300 mt-1">Add</span>
        </button>

        {/* Sales Pipeline */}
        <Link
          href="/sales-pipeline"
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === '/sales-pipeline' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Pipeline</span>
        </Link>

        {/* Focus Mode */}
        <button
          onClick={() => setIsFocusModeOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Focus</span>
        </button>

      </div>
    </div>
  );
}
