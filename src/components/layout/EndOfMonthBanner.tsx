'use client';

import React from 'react';
import { useApp } from '@/lib/context/app-context';
import { exportLeadsToCsv } from '@/lib/export-utils';
import { Calendar, Download, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export function EndOfMonthBanner() {
  const { isEndOfMonth, currentUser, leads } = useApp();

  // Only render for Team Leaders
  if (!isEndOfMonth || currentUser.role !== 'team_leader') {
    return null;
  }

  const [currentMonthName, setCurrentMonthName] = React.useState('Current Month');

  React.useEffect(() => {
    setCurrentMonthName(format(new Date(), 'MMMM'));
  }, []);

  const handleExport = () => {
    exportLeadsToCsv(leads, `Master_Ads_Injection_${currentMonthName}_Leads_Export.csv`);
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 px-4 py-2.5 text-xs text-amber-200 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
            <Calendar className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="font-bold text-amber-300">
              ⚠️ End-of-Month Pipeline Alert:
            </span>{' '}
            <span className="text-amber-200/90">
              Final 48-Hour Billing Close window for <strong className="text-white underline">{currentMonthName}</strong> is active. Audit all pending deals.
            </span>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>📥 Export All {currentMonthName} Leads to CSV</span>
        </button>
      </div>
    </div>
  );
}
