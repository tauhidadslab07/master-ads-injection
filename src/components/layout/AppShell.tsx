'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/lib/context/app-context';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { EndOfMonthBanner } from '@/components/layout/EndOfMonthBanner';
import { DuplicateAlertBanner } from '@/components/layout/DuplicateAlertBanner';
import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { BulkImportModal } from '@/components/leads/BulkImportModal';
import { LeadDetailsDrawer } from '@/components/leads/LeadDetailsDrawer';
import { OutreachFocusMode } from '@/components/leads/OutreachFocusMode';
import { TeamRosterModal } from '@/components/team/TeamRosterModal';
import { DuplicateReviewModal } from '@/components/leads/DuplicateReviewModal';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-16 md:pb-0">
      {/* End of Month Close Alert Banner */}
      <EndOfMonthBanner />

      {/* Retroactive Pipeline Duplicate Alert Banner */}
      <DuplicateAlertBanner onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)} />

      {/* Main Top Navigation Header */}
      <Navbar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Mobile Navigation */}
      <MobileNav
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

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

      <LeadDetailsDrawer />

      <OutreachFocusMode />
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
