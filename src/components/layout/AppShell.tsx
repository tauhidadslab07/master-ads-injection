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

import { LeaderInspectionBanner } from '@/components/layout/LeaderInspectionBanner';
import { LoginModal } from '@/components/auth/LoginModal';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { 
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

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Left Sidebar (Matching Nexus CRM & Responsive Mobile Drawer) */}
      <Sidebar
        isMobileOpen={isMobileDrawerOpen}
        onMobileClose={() => setIsMobileDrawerOpen(false)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenNichesModal={() => setIsNichesModalOpen(true)}
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
