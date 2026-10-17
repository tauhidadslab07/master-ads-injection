'use client';

import React from 'react';
import { useApp } from '@/lib/context/app-context';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface DuplicateAlertBannerProps {
  onOpenDuplicateModal: () => void;
}

export function DuplicateAlertBanner({ onOpenDuplicateModal }: DuplicateAlertBannerProps) {
  const { retroactiveDuplicates } = useApp();

  const count = retroactiveDuplicates.length;
  if (count === 0) return null;

  return (
    <div className="w-full bg-amber-950/40 border-b border-amber-600/40 px-4 py-2 text-xs text-amber-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong>⚠️ {count} Duplicate Contact(s) Detected</strong> across your pipeline (Phone, Email, or Company matches).
          </span>
        </div>

        <button
          onClick={onOpenDuplicateModal}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-semibold text-xs transition-colors"
        >
          <span>Review Duplicates ({count})</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
