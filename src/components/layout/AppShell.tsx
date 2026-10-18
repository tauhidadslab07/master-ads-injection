'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/lib/context/app-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { EndOfMonthBanner } from '@/components/layout/EndOfMonthBanner';
import { DuplicateAlertBanner } from '@/components/layout/DuplicateAlertBanner';
import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { BulkImportModal } from '@/components/leads/BulkImportModal';
import { LeadDetailsDrawer } from '@/components/leads/LeadDetailsDrawer';
import { OutreachFocusMode } from '@/components/leads/OutreachFocusMode';
import { TeamRosterModal } from '@/components/team/TeamRosterModal';
import { DuplicateReviewModal } from '@/components/leads/DuplicateReviewModal';
import { NichesModal } from '@/components/leads/NichesModal';
import { AdvancedExportModal } from '@/components/leads/AdvancedExportModal';
import { CloudSyncModal } from '@/components/sync/CloudSyncModal';

import { LeaderInspectionBanner } from '@/components/layout/LeaderInspectionBanner';
import { LoginModal } from '@/components/auth/LoginModal';
import { AuthGateScreen } from '@/components/auth/AuthGateScreen';
import { ShieldCheck } from 'lucide-react';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { 
    isAuthenticated,
    isAuthLoaded,
    isNichesModalOpen, 
    setIsNichesModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isBatchModalOpen,
    setIsBatchModalOpen,
    isLoginModalOpen,
    setIsLoginModalOpen
  } = useApp();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Initial loading state while reading session from localStorage
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-cyan-500/20 animate-pulse">
          <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs text-white font-bold tracking-widest uppercase">Master Ads Injection</p>
          <p className="text-[11px] text-slate-400 font-mono">ভেরিফাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate: Block entire CRM if not logged in!
  if (!isAuthenticated) {
    return <AuthGateScreen />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Left Sidebar (Matching Nexus CRM & Responsive Mobile Drawer) */}
      <Sidebar
        isMobileOpen={isMobileDrawerOpen}
        onMobileClose={() => setIsMobileDrawerOpen(false)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenNichesModal={() => setIsNichesModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCloudSyncModal={() => setIsCloudSyncModalOpen(true)}
      />

      {/* Main Right Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar with Mobile Drawer Trigger, Search & Action Pills */}
        <TopHeader
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
          onOpenNichesModal={() => setIsNichesModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenCloudSyncModal={() => setIsCloudSyncModalOpen(true)}
        />

        {/* Team Leader Impersonation / Inspection Banner */}
        <LeaderInspectionBanner />

        {/* Banners */}
        <EndOfMonthBanner />
        <DuplicateAlertBanner onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)} />

        {/* Scrollable Main Workspace Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
        />
      </div>

      {/* Modals & Slide-out Drawers */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <BulkImportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      <TeamRosterModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      <DuplicateReviewModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
      />

      <NichesModal
        isOpen={isNichesModalOpen}
        onClose={() => setIsNichesModalOpen(false)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <LeadDetailsDrawer />

      <OutreachFocusMode />

      {/* Profile Authentication Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Advanced Leads Bulk Exporter Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Central Cloud Database Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppProvider>
  );
}
