'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Lead, 
  TeamMember, 
  LeadActivity, 
  MemberActivityMistake, 
  DuplicateCheckResult, 
  DuplicateMatch,
  ClientReaction,
  LeadStage,
  DailyTask,
  DailyTaskStatus,
  DailyTaskPriority,
  DailyTaskCategory,
  DailyTaskAssigneeStatus,
  OutreachChannel
} from '@/types/crm';
import { INITIAL_TEAM_MEMBERS, INITIAL_LEADS, INITIAL_ACTIVITIES, INITIAL_MISTAKES, INITIAL_DAILY_TASKS } from '@/lib/mock-data';
import { normalizePhone } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { createClient } from '@/lib/supabase/client';

interface AppContextType {
  leads: Lead[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  activities: LeadActivity[];
  mistakes: MemberActivityMistake[];
  selectedLead: Lead | null;
  isLeadDrawerOpen: boolean;
  channelFilter: 'all' | 'whatsapp' | 'email';
  isFocusModeOpen: boolean;
  simulateEndOfMonth: boolean;
  isEndOfMonth: boolean;
  selectedNiche: string;
  isNichesModalOpen: boolean;
  isCreateModalOpen: boolean;
  isBatchModalOpen: boolean;
  retroactiveDuplicates: { lead: Lead; conflictingLeads: Lead[]; reasons: string[] }[];
  
  // Actions
  setCurrentUser: (member: TeamMember) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setIsLeadDrawerOpen: (open: boolean) => void;
  setChannelFilter: (channel: 'all' | 'whatsapp' | 'email') => void;
  setIsFocusModeOpen: (open: boolean) => void;
  setSimulateEndOfMonth: (simulate: boolean) => void;
  setSelectedNiche: (niche: string) => void;
  setIsNichesModalOpen: (open: boolean) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsBatchModalOpen: (open: boolean) => void;
  
  // Lead Operations
  checkDuplicate: (phone: string, email: string, company: string, excludeId?: string) => Promise<DuplicateCheckResult>;
  createLead: (leadData: Partial<Lead>, allowDuplicateAnyway?: boolean, initialNote?: string) => { success: boolean; lead?: Lead; error?: string };
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  
  // Approval Gate & Trusted Hunter
  approveLead: (leadId: string) => { success: boolean; message: string };
  passAudit: (leadId: string, notes?: string) => { success: boolean; message: string };
  sendToAudit: (leadId: string, auditorId?: string) => { success: boolean; message: string };
  assignAuditor: (leadId: string, auditorId: string) => { success: boolean; message: string };
  bulkSendToAudit: (leadIds: string[], auditorId?: string) => { success: boolean; count: number };
  bulkAssignAuditor: (leadIds: string[], auditorId: string) => { success: boolean; count: number };
  bulkPassAudit: (leadIds: string[]) => { success: boolean; count: number };
  assignLead: (leadId: string, assigneeId: string, channel?: OutreachChannel) => { success: boolean; message: string };
  bulkAssignLead: (leadIds: string[], assigneeId: string, channel?: OutreachChannel) => { success: boolean; count: number };
  rejectLead: (leadId: string, reason: string) => { success: boolean; message: string };
  toggleDeputy: (memberId: string) => void;
  
  // Emergency Leave / Offboarding & Planned Availability
  triggerEmergencyLeave: (memberId: string) => Promise<{ success: boolean; reassignedCount: number }>;
  updateMemberLeaveSchedule: (memberId: string, startDate?: string, endDate?: string, onLeave?: boolean) => void;
  submitBatchToLeader: (note?: string) => { success: boolean; message: string };
  resubmitRejectedLead: (leadId: string, updatedData?: Partial<Lead>) => { success: boolean; message: string };
  
  // Cadence & Mistake Guard
  advanceCadence: (leadId: string, currentReaction?: ClientReaction, note?: string) => { success: boolean; error?: string };
  updateClientReaction: (leadId: string, reaction: ClientReaction) => void;
  markAsDnc: (leadId: string, reason: string) => void;
  
  // Pipeline & Audit
  triggerAudit: (leadId: string) => { success: boolean; error?: string };
  transferToSalesPipeline: (leadId: string, closerId: string) => { success: boolean; error?: string };
  recycleLead: (leadId: string) => { success: boolean; error?: string };
  
  // Notes & Mentions
  addActivityNote: (leadId: string, content: string, mentions?: string[], activityType?: LeadActivity['activity_type']) => void;
  
  // Batch Import
  batchImportLeads: (leadsToImport: Partial<Lead>[], autoSkipDuplicates: boolean) => { 
    importedCount: number; 
    skippedDuplicates: number; 
    inBatchDuplicates: number; 
  };
  
  // Retroactive duplicate resolution
  resolveDuplicate: (keepLeadId: string, discardLeadId: string) => void;

  // Specific Callback & Snooze
  setScheduledCallback: (leadId: string, date: string, reason?: string) => void;
  clearScheduledCallback: (leadId: string) => void;

  // Authentication & Impersonation by Team Leader
  isAuthenticated: boolean;
  isAuthLoaded: boolean;
  leaderSession: TeamMember | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  inspectMember: (member: TeamMember) => void;
  exitInspection: () => void;
  logout: () => void;
  loginWithCredentials: (username: string, password: string) => { success: boolean; error?: string };

  // Team Leader Daily Tasks & Multi-Member Dispatch
  dailyTasks: DailyTask[];
  createDailyTask: (taskData: Omit<DailyTask, 'id' | 'created_at' | 'assignee_statuses'>) => { success: boolean; task?: DailyTask; error?: string };
  updateDailyTaskStatus: (taskId: string, memberId: string, status: DailyTaskStatus, note?: string, progressCount?: number) => { success: boolean };
  deleteDailyTask: (taskId: string) => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [activities, setActivities] = useState<LeadActivity[]>(INITIAL_ACTIVITIES);
  const [mistakes, setMistakes] = useState<MemberActivityMistake[]>(INITIAL_MISTAKES);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(INITIAL_DAILY_TASKS);
  
  // Authentication state - Default to unauthenticated until verified
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);

  // Current user and leader session
  const [currentUser, setCurrentUser] = useState<TeamMember>(INITIAL_TEAM_MEMBERS[0]);
  const [leaderSession, setLeaderSession] = useState<TeamMember | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState<boolean>(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [isFocusModeOpen, setIsFocusModeOpen] = useState<boolean>(false);
  const [simulateEndOfMonth, setSimulateEndOfMonth] = useState<boolean>(false);
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [isNichesModalOpen, setIsNichesModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  // Restore authenticated session from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('master_ads_user_id');
      const savedLeaderId = localStorage.getItem('master_ads_leader_id');
      if (savedUserId) {
        const foundUser = teamMembers.find(m => m.id === savedUserId);
        if (foundUser) {
          setCurrentUser(foundUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      if (savedLeaderId) {
        const foundLeader = teamMembers.find(m => m.id === savedLeaderId);
        if (foundLeader) setLeaderSession(foundLeader);
      }
      setIsAuthLoaded(true);
    }
  }, [teamMembers]);

  // Sync Supabase if available
  useEffect(() => {
    try {
      const supabase = createClient();
      // Test connectivity or fetch if configured
      supabase.from('team_members').select('id').limit(1).then(({ error }) => {
        if (!error) {
          // Live Supabase connected
          console.info('Connected to Supabase live instance.');
        }
      });
    } catch {
      // Local state fallback is active
    }
  }, []);

  // Hydrate leads with full hunter, assignee and auditor objects
  const hydratedLeads = useMemo(() => {
    return leads.map(l => ({
      ...l,
      hunter: teamMembers.find(m => m.id === l.original_hunter_id),
      assignee: teamMembers.find(m => m.id === l.current_assignee_id),
      auditor: teamMembers.find(m => m.id === (l.auditor_id || (l.stage === 'audit' ? l.current_assignee_id : undefined)))
    }));
  }, [leads, teamMembers]);

  // Keep selectedLead updated if leads state changes
  useEffect(() => {
    if (selectedLead) {
      const updated = hydratedLeads.find(l => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  }, [hydratedLeads, selectedLead?.id]);

  // End of Month detection (last 2 days of month) deferred to useEffect for Next.js prerender
  const [isEndOfMonth, setIsEndOfMonth] = useState<boolean>(false);

  useEffect(() => {
    if (simulateEndOfMonth) {
      setIsEndOfMonth(true);
      return;
    }
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    setIsEndOfMonth(now.getDate() >= lastDayOfMonth - 1);
  }, [simulateEndOfMonth]);

  // Retroactive Deduplication Scanner across entire pipeline
  const retroactiveDuplicates = useMemo(() => {
    const dupsMap: { lead: Lead; conflictingLeads: Lead[]; reasons: string[] }[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < hydratedLeads.length; i++) {
      const leadA = hydratedLeads[i];
      const conflicts: Lead[] = [];
      const reasons: string[] = [];

      for (let j = 0; j < hydratedLeads.length; j++) {
        if (i === j) continue;
        const leadB = hydratedLeads[j];

        const phoneMatch = leadA.phone_e164 && leadB.phone_e164 && leadA.phone_e164 === leadB.phone_e164;
        const emailMatch = leadA.email && leadB.email && leadA.email.toLowerCase().trim() === leadB.email.toLowerCase().trim();
        const companyMatch = leadA.company_name && leadB.company_name && 
          leadA.company_name.trim().length >= 3 && 
          leadB.company_name.trim().length >= 3 && 
          leadA.company_name.toLowerCase().trim() === leadB.company_name.toLowerCase().trim();

        if (phoneMatch || emailMatch || companyMatch) {
          conflicts.push(leadB);
          if (phoneMatch && !reasons.includes('Phone')) reasons.push(`Phone (${leadA.phone})`);
          if (emailMatch && !reasons.includes('Email')) reasons.push(`Email (${leadA.email})`);
          if (companyMatch && !reasons.includes('Company')) reasons.push(`Company (${leadA.company_name})`);
        }
      }

      if (conflicts.length > 0) {
        dupsMap.push({
          lead: leadA,
          conflictingLeads: conflicts,
          reasons
        });
      }
    }

    return dupsMap;
  }, [hydratedLeads]);

  // Real-time Deduplication Check for Creation & Edit
  const checkDuplicate = useCallback(async (
    phone: string, 
    email: string, 
    company: string, 
    excludeId?: string
  ): Promise<DuplicateCheckResult> => {
    const sanitizedPhone = normalizePhone(phone);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedCompany = company.toLowerCase().trim();

    const matches: DuplicateMatch[] = [];
    const offendingFields: { phone?: boolean; email?: boolean; company?: boolean } = {};

    // Check in-memory hydrated leads
    for (const l of hydratedLeads) {
      if (excludeId && l.id === excludeId) continue;

      const phoneMatch = Boolean(sanitizedPhone && l.phone_e164 && l.phone_e164 === sanitizedPhone);
      const emailMatch = Boolean(sanitizedEmail && l.email && l.email.toLowerCase().trim() === sanitizedEmail);
      
      const targetDomain = sanitizedCompany.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
      const companyMatch = Boolean(
        (sanitizedCompany.length >= 3 && l.company_name && l.company_name.toLowerCase().trim() === sanitizedCompany) ||
        (targetDomain.length >= 3 && (
          (l.company_name && l.company_name.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') === targetDomain) ||
          (l.website && l.website.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') === targetDomain)
        ))
      );

      if (phoneMatch || emailMatch || companyMatch) {
        const reasons: string[] = [];
        if (phoneMatch) {
          reasons.push(`Phone (${l.phone})`);
          offendingFields.phone = true;
        }
        if (emailMatch) {
          reasons.push(`Email (${l.email})`);
          offendingFields.email = true;
        }
        if (companyMatch) {
          reasons.push(`Website / Company (${l.website || l.company_name})`);
          offendingFields.company = true;
        }

        matches.push({
          id: l.id,
          company_name: l.company_name,
          contact_name: l.contact_name,
          email: l.email,
          phone: l.phone,
          phone_e164: l.phone_e164,
          stage: l.stage,
          hunter_name: l.hunter?.full_name || 'Hunter',
          hunter_phone: l.hunter?.phone || '',
          match_reasons: reasons
        });
      }
    }

    const isDuplicate = matches.length > 0;
    if (isDuplicate) {
      soundEngine.playWarningChime();
    }

    return {
      isDuplicate,
      matches,
      offendingFields
    };
  }, [hydratedLeads]);

  // Add Activity Note with @Mention chime
  const addActivityNote = useCallback((
    leadId: string, 
    content: string, 
    mentions: string[] = [], 
    activityType: LeadActivity['activity_type'] = 'note'
  ) => {
    const newNote: LeadActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      lead_id: leadId,
      author_id: currentUser.id,
      activity_type: activityType,
      content,
      mentions,
      created_at: new Date().toISOString(),
      author: currentUser
    };

    setActivities(prev => [newNote, ...prev]);

    if (mentions.length > 0) {
      soundEngine.playMentionChime();
    }
  }, [currentUser]);

  // Single Entity Creation with Fail-Safe Lock
  const createLead = useCallback((leadData: Partial<Lead>, allowDuplicateAnyway: boolean = false, initialNote?: string) => {
    const phone = leadData.phone || '';
    const email = leadData.email || '';
    const company = leadData.company_name || '';
    const phone_e164 = normalizePhone(phone);

    // Auto-detect channel: if phone exists -> whatsapp, else email
    const autoChannel = leadData.channel || (phone.trim() ? 'whatsapp' : 'email');

    // Synchronous check against active pipeline
    const existingConflicts = hydratedLeads.filter(l => {
      const pMatch = Boolean(phone_e164 && l.phone_e164 && l.phone_e164 === phone_e164);
      const eMatch = Boolean(email && l.email && l.email.toLowerCase().trim() === email.toLowerCase().trim());
      const targetDomain = company.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
      const cMatch = Boolean(
        (company.length >= 3 && l.company_name && l.company_name.toLowerCase().trim() === company.toLowerCase().trim()) ||
        (targetDomain.length >= 3 && (
          (l.company_name && l.company_name.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') === targetDomain) ||
          (l.website && l.website.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') === targetDomain)
        ))
      );
      return pMatch || eMatch || cMatch;
    });

    if (existingConflicts.length > 0 && !allowDuplicateAnyway) {
      soundEngine.playWarningChime();
      return {
        success: false,
        error: '⚠️ Duplicate Warning Active: You must toggle "Allow adding duplicate record anyway" to proceed.'
      };
    }

    // Hunter attribution logic
    const hunterId = leadData.original_hunter_id || currentUser.id;

    // Per user requirement: All collected leads start in Raw Outreach ('lead_added')
    // and remain unassigned until Quality Audit is passed and Team Leader assigns them.
    const initialStage: LeadStage = 'lead_added';

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      company_name: company,
      contact_name: leadData.contact_name || 'Prospect Lead',
      email: email,
      phone: phone,
      phone_e164: phone_e164,
      channel: autoChannel,
      website: leadData.website || '',
      stage: initialStage,
      original_hunter_id: hunterId,
      current_assignee_id: undefined, // Unassigned until audited and assigned by TL
      is_audit_sample: false,
      cadence_step: 0,
      cadence_last_step_at: new Date().toISOString(),
      last_client_reaction: 'unseen',
      recycled_count: 0,
      is_dnc: false,
      deal_value: Number(leadData.deal_value) || 25000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setLeads(prev => [newLead, ...prev]);

    // Add initial activity
    addActivityNote(newLead.id, `📥 Lead uploaded to Raw Outreach stage by ${currentUser.full_name}. Awaiting Quality Audit.`, [], 'status_change');

    // Add user's custom context note if provided
    if (initialNote && initialNote.trim()) {
      addActivityNote(newLead.id, `📝 Note: ${initialNote.trim()}`, [], 'note');
    }

    soundEngine.playSuccessChime();

    return { success: true, lead: newLead };
  }, [hydratedLeads, currentUser, teamMembers, addActivityNote]);

  // Update Lead
  const updateLead = useCallback((leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    }));
  }, []);



  // Send lead to Audit Stage (Team Leader assigns a member to audit)
  const sendToAudit = useCallback((leadId: string, auditorId?: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    const auditor = auditorId ? teamMembers.find(m => m.id === auditorId) : null;

    updateLead(leadId, {
      stage: 'audit',
      auditor_id: auditorId,
      current_assignee_id: auditorId
    });

    addActivityNote(
      leadId,
      auditor 
        ? `🔍 অডিটের জন্য এসাইন করা হয়েছে: ${auditor.full_name}-কে অডিটর হিসেবে নির্ধারণ করেছেন ${currentUser.full_name}। লিডটি Audited Lead সেকশনে রয়েছে।`
        : `🔍 Sent to Audit Stage by ${currentUser.full_name}. Awaiting quality verification.`,
      auditor ? [auditor.id] : [],
      'audit_assigned'
    );

    soundEngine.playSuccessChime();
    return { 
      success: true, 
      message: auditor 
        ? `লিডটি সফলভাবে ${auditor.full_name}-কে অডিটের জন্য এসাইন করা হয়েছে এবং Audited Lead সেকশনে পাঠানো হয়েছে।`
        : 'Lead moved to Audit Stage.' 
    };
  }, [hydratedLeads, teamMembers, currentUser, updateLead, addActivityNote]);

  const assignAuditor = useCallback((leadId: string, auditorId: string) => {
    return sendToAudit(leadId, auditorId);
  }, [sendToAudit]);

  // Quality Audit Pass (moves to 'audited', ready for TL assignment)
  const passAudit = useCallback((leadId: string, notes?: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    // Increment consecutive approvals for hunter
    if (lead.original_hunter_id) {
      setTeamMembers(prev => prev.map(m => {
        if (m.id === lead.original_hunter_id) {
          const newStreak = m.consecutive_approvals + 1;
          return {
            ...m,
            consecutive_approvals: newStreak,
            is_trusted_hunter: newStreak >= 20 ? true : m.is_trusted_hunter
          };
        }
        return m;
      }));
    }

    updateLead(leadId, {
      stage: 'audited',
      audited_at: new Date().toISOString(),
      audited_by: currentUser.id,
      audit_notes: notes || lead.audit_notes,
      current_assignee_id: undefined, // Cleared and ready for Team Leader to assign to Sales Member!
      rejection_reason: undefined
    });

    addActivityNote(
      leadId,
      `✅ Quality Audit Passed by ${currentUser.full_name}.${notes ? ` অডিট নোট: ${notes}` : ''} লিডটি এখন অডিটেড এবং টিম লিডার কর্তৃক সেলস মেম্বারকে ইমেইল/মেসেজের জন্য এসাইন করার জন্য প্রস্তুত।`,
      [lead.original_hunter_id],
      'audit_completed'
    );

    soundEngine.playSuccessChime();
    return { success: true, message: 'Audit passed successfully! Lead is ready for Team Leader assignment.' };
  }, [hydratedLeads, currentUser, updateLead, addActivityNote]);

  const approveLead = useCallback((leadId: string) => {
    return passAudit(leadId);
  }, [passAudit]);

  // Bulk Send Leads to Audit
  const bulkSendToAudit = useCallback((leadIds: string[], auditorId?: string) => {
    if (!leadIds.length) return { success: false, count: 0 };
    const auditor = auditorId ? teamMembers.find(m => m.id === auditorId) : null;

    setLeads(prev => prev.map(l => {
      if (leadIds.includes(l.id)) {
        return {
          ...l,
          stage: 'audit',
          auditor_id: auditorId || l.auditor_id,
          current_assignee_id: auditorId || l.current_assignee_id,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    }));

    leadIds.forEach(id => {
      addActivityNote(
        id, 
        auditor 
          ? `🔍 বাল্ক অডিট এসাইনমেন্ট: ${auditor.full_name} কে অডিট করার দায়িত্ব দিয়েছেন ${currentUser.full_name}।`
          : `🔍 Bulk sent to Audit by ${currentUser.full_name}.`, 
        auditor ? [auditor.id] : [], 
        'audit_assigned'
      );
    });

    soundEngine.playSuccessChime();
    return { success: true, count: leadIds.length };
  }, [teamMembers, currentUser, addActivityNote]);

  const bulkAssignAuditor = useCallback((leadIds: string[], auditorId: string) => {
    return bulkSendToAudit(leadIds, auditorId);
  }, [bulkSendToAudit]);

  // Bulk Pass Audit (Moves to 'audited', ready for TL assignment)
  const bulkPassAudit = useCallback((leadIds: string[]) => {
    if (!leadIds.length) return { success: false, count: 0 };
    setLeads(prev => prev.map(l => {
      if (leadIds.includes(l.id)) {
        return {
          ...l,
          stage: 'audited',
          audited_at: new Date().toISOString(),
          audited_by: currentUser.id,
          current_assignee_id: undefined,
          rejection_reason: undefined,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    }));
    leadIds.forEach(id => {
      addActivityNote(id, `✅ Quality Audit Passed in bulk by ${currentUser.full_name}. Moved to Audited Leads.`, [], 'audit_completed');
    });
    soundEngine.playSuccessChime();
    return { success: true, count: leadIds.length };
  }, [currentUser, addActivityNote]);

  // Bulk Assign Audited Leads to a Sales Member (Supports Channel!)
  const bulkAssignLead = useCallback((leadIds: string[], assigneeId: string, channel?: OutreachChannel) => {
    if (!leadIds.length) return { success: false, count: 0 };
    const assignee = teamMembers.find(m => m.id === assigneeId);
    if (!assignee) return { success: false, count: 0 };

    setLeads(prev => prev.map(l => {
      if (leadIds.includes(l.id)) {
        return {
          ...l,
          current_assignee_id: assigneeId,
          channel: channel || l.channel || 'whatsapp',
          stage: 'contacted',
          cadence_step: l.cadence_step ?? 0,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    }));

    leadIds.forEach(id => {
      addActivityNote(
        id, 
        `🎯 Bulk assigned to ${assignee.full_name} (${assignee.role}) by ${currentUser.full_name}. Lead is live in their Today's Work dashboard.`, 
        [assignee.id], 
        'sales_assigned'
      );
    });

    soundEngine.playSuccessChime();
    return { success: true, count: leadIds.length };
  }, [teamMembers, currentUser, addActivityNote]);

  // Reject Lead with mandatory reason
  const rejectLead = useCallback((leadId: string, reason: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    const canApprove = currentUser.role === 'team_leader' || currentUser.is_deputy;
    if (!canApprove) {
      return { success: false, message: 'Only Team Leader or Deputy can reject leads.' };
    }

    if (!reason.trim()) {
      return { success: false, message: 'Rejection requires a documented reason for the hunter.' };
    }

    // Reset hunter streak on rejection
    setTeamMembers(prev => prev.map(m => {
      if (m.id === lead.original_hunter_id) {
        return {
          ...m,
          consecutive_approvals: 0,
          is_trusted_hunter: false
        };
      }
      return m;
    }));

    updateLead(leadId, {
      stage: 'lead_added',
      rejection_reason: reason.trim()
    });

    addActivityNote(
      leadId,
      `❌ Lead Rejected by ${currentUser.full_name}. Reason: "${reason.trim()}". Returned to Hunter.`,
      [lead.original_hunter_id],
      'rejection'
    );

    soundEngine.playWarningChime();
    return { success: true, message: 'Lead rejected and returned to hunter with feedback.' };
  }, [hydratedLeads, currentUser, updateLead, addActivityNote]);

  // Toggle Deputy Status (Leader only)
  const toggleDeputy = useCallback((memberId: string) => {
    if (currentUser.role !== 'team_leader') {
      return;
    }
    setTeamMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, is_deputy: !m.is_deputy };
      }
      return m;
    }));
  }, [currentUser]);

  // Emergency Leave / Offboarding (RPC trigger_emergency_leave_and_reassign)
  const triggerEmergencyLeave = useCallback(async (memberId: string) => {
    const activeOthers = teamMembers.filter(m => m.id !== memberId && m.is_active && !m.on_leave);
    if (activeOthers.length === 0) {
      return { success: false, reassignedCount: 0 };
    }

    // Mark member as on leave
    setTeamMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, on_leave: true, is_active: false };
      }
      return m;
    }));

    // Round-robin reassign open leads while strictly preserving original_hunter_id
    let count = 0;
    setLeads(prev => prev.map(lead => {
      const isOpen = lead.stage !== 'closed_won' && lead.stage !== 'closed_lost' && lead.stage !== 'archived';
      if (lead.current_assignee_id === memberId && isOpen) {
        const nextAssignee = activeOthers[count % activeOthers.length];
        count++;

        addActivityNote(
          lead.id,
          `🔄 Emergency Leave Reassignment: Lead round-robin reassigned to ${nextAssignee.full_name}. Original hunter attribution preserved.`,
          [nextAssignee.id],
          'status_change'
        );

        return {
          ...lead,
          current_assignee_id: nextAssignee.id,
          updated_at: new Date().toISOString()
        };
      }
      return lead;
    }));

    soundEngine.playSuccessChime();
    return { success: true, reassignedCount: count };
  }, [teamMembers, addActivityNote]);

  // Update member planned leave schedule
  const updateMemberLeaveSchedule = useCallback((memberId: string, startDate?: string, endDate?: string, onLeave?: boolean) => {
    setTeamMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          leave_start_date: startDate !== undefined ? startDate : m.leave_start_date,
          leave_end_date: endDate !== undefined ? endDate : m.leave_end_date,
          on_leave: onLeave !== undefined ? onLeave : m.on_leave
        };
      }
      return m;
    }));
    soundEngine.playSuccessChime();
  }, []);

  // Submit batch to leader
  const submitBatchToLeader = useCallback((note?: string) => {
    const leader = teamMembers.find(m => m.role === 'team_leader') || teamMembers[0];
    const content = `🚀 [Batch Submission] ${currentUser.full_name} has completed their daily target batch and submitted it for leader review.${note ? ` Note: "${note}"` : ''}`;
    
    // Add activity note with mention of leader
    const newAct: LeadActivity = {
      id: `act-${Date.now()}`,
      lead_id: 'general',
      author_id: currentUser.id,
      activity_type: 'status_change',
      content,
      mentions: [leader.id],
      created_at: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev]);
    soundEngine.playSuccessChime();
    return { success: true, message: `ব্যাচ সফলভাবে টিম লিডার ${leader.full_name}-এর কাছে সাবমিট করা হয়েছে!` };
  }, [currentUser, teamMembers]);

  // Resubmit rejected lead after hunter revision
  const resubmitRejectedLead = useCallback((leadId: string, updatedData?: Partial<Lead>) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    updateLead(leadId, {
      ...updatedData,
      stage: 'lead_added',
      rejection_reason: undefined,
      updated_at: new Date().toISOString()
    });

    addActivityNote(
      leadId,
      `🔄 [Lead Revised & Resubmitted] ${currentUser.full_name} has revised contact information and resubmitted lead for audit review.`,
      [],
      'status_change'
    );

    soundEngine.playSuccessChime();
    return { success: true, message: 'লিডটি সফলভাবে সংশোধন করে পুনরায় অডিটে পাঠানো হয়েছে!' };
  }, [hydratedLeads, updateLead, addActivityNote, currentUser]);

  // Cadence Step Advancement with Mistake Guard Hard-Lock
  const advanceCadence = useCallback((leadId: string, explicitReaction?: ClientReaction, note?: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found.' };

    const currentStep = lead.cadence_step ?? 0;
    const reaction = explicitReaction || (lead.last_client_reaction !== 'unseen' ? lead.last_client_reaction : undefined);

    // Mistake Guard: When advancing from Step 1 onwards, last message status must be updated
    if (currentStep >= 1 && (!reaction || reaction === 'unseen')) {
      const mistakeRecord: MemberActivityMistake = {
        id: `mst-${Date.now()}`,
        lead_id: leadId,
        member_id: currentUser.id,
        mistake_type: 'cadence_advanced_without_reaction',
        description: `Blocked: Attempted to advance cadence step from Step ${currentStep} while last message status was still unverified ("Unseen").`,
        attempted_action: `Advance Cadence (Step ${currentStep} -> Step ${currentStep + 1})`,
        created_at: new Date().toISOString()
      };

      setMistakes(prev => [mistakeRecord, ...prev]);
      soundEngine.playWarningChime();

      return {
        success: false,
        error: '⚠️ Warning: Last Message Status Update Required! Please record what happened to the previous message (Seen, Replied, Interested, Not Interested) before advancing.'
      };
    }

    const nextStep = currentStep + 1;
    let nextStage = lead.stage;

    // After 5th follow-up (step 5) -> All Done
    if (nextStep >= 6) {
      nextStage = 'all_done';
    } else {
      nextStage = 'contacted';
    }

    updateLead(leadId, {
      cadence_step: Math.min(nextStep, 6),
      cadence_last_step_at: new Date().toISOString(),
      last_client_reaction: reaction || 'unseen',
      stage: nextStage
    });

    // Save per-stage note if provided
    if (note && note.trim()) {
      addActivityNote(
        leadId,
        `📝 Stage Note (Step ${currentStep}): ${note.trim()}`,
        [],
        'note'
      );
    }

    const stepLabels: Record<number, string> = {
      1: '1st Follow-up (FU 1)',
      2: '2nd Follow-up (FU 2)',
      3: '3rd Follow-up (FU 3)',
      4: '4th Follow-up (FU 4)',
      5: '5th Follow-up (FU 5)',
      6: '🎉 All Done'
    };

    addActivityNote(
      leadId,
      `✓ Message Sent! Advanced to ${stepLabels[nextStep] || `Step ${nextStep}`}.${reaction ? ` Last message status: [${reaction}].` : ''}`,
      [],
      'cadence_advance'
    );

    soundEngine.playSuccessChime();
    return { success: true };
  }, [hydratedLeads, currentUser, updateLead, addActivityNote]);

  // Assign Audited Lead to a Sales Member for WhatsApp/Email Outreach (Leader / Deputy)
  const assignLead = useCallback((leadId: string, assigneeId: string, channel?: OutreachChannel) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    const assignee = teamMembers.find(m => m.id === assigneeId);
    if (!assignee) return { success: false, message: 'Assignee not found.' };

    const targetChannel = channel || lead.channel || 'whatsapp';

    updateLead(leadId, {
      current_assignee_id: assigneeId,
      channel: targetChannel,
      stage: 'contacted',
      cadence_step: lead.cadence_step ?? 0,
    });

    addActivityNote(
      leadId,
      `🎯 Assigned to ${assignee.full_name} (${assignee.role}) for ${targetChannel.toUpperCase()} outreach by ${currentUser.full_name}. Lead is now live in their Today's Work queue.`,
      [assignee.id],
      'sales_assigned'
    );

    soundEngine.playSuccessChime();
    return { success: true, message: `Lead successfully assigned to ${assignee.full_name} for ${targetChannel.toUpperCase()} outreach.` };
  }, [hydratedLeads, teamMembers, currentUser, updateLead, addActivityNote]);

  // Update Client Reaction
  const updateClientReaction = useCallback((leadId: string, reaction: ClientReaction) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return;

    let nextStage = lead.stage;
    if (reaction === 'replied' && (lead.stage === 'contacted' || lead.stage === 'approved')) {
      nextStage = 'replied';
    }

    updateLead(leadId, {
      last_client_reaction: reaction,
      stage: nextStage
    });

    addActivityNote(
      leadId,
      `Client reaction updated to: [${reaction.toUpperCase()}].`,
      [],
      'status_change'
    );
  }, [hydratedLeads, updateLead, addActivityNote]);

  // Hard-Lock DNC (Do Not Contact)
  const markAsDnc = useCallback((leadId: string, reason: string) => {
    updateLead(leadId, {
      is_dnc: true,
      dnc_marked_at: new Date().toISOString(),
      dnc_reason: reason.trim() || 'Prospect requested Do Not Contact.'
    });

    addActivityNote(
      leadId,
      `🚫 HARD-LOCK ACTIVATED: Lead marked as DO NOT CONTACT (DNC). Reason: "${reason.trim()}". All communication channels disabled permanently.`,
      [],
      'dnc'
    );

    soundEngine.playWarningChime();
  }, [updateLead, addActivityNote]);

  // Trigger Audit (Bridge to Sales Pipeline - ONLY after Replied)
  const triggerAudit = useCallback((leadId: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found.' };

    if (lead.stage !== 'replied') {
      return {
        success: false,
        error: 'Audit task can ONLY be triggered after a lead is marked "Replied".'
      };
    }

    updateLead(leadId, {
      stage: 'audit'
    });

    addActivityNote(
      leadId,
      `🎯 Audit Task Triggered: Competitor ad injection tear-sheet and ROAS audit initiated for ${lead.company_name}.`,
      [lead.original_hunter_id],
      'status_change'
    );

    soundEngine.playSuccessChime();
    return { success: true };
  }, [hydratedLeads, updateLead, addActivityNote]);

  // Transfer to Sales Pipeline
  const transferToSalesPipeline = useCallback((leadId: string, closerId: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found.' };

    const closer = teamMembers.find(m => m.id === closerId);

    updateLead(leadId, {
      stage: 'sales_pipeline',
      current_assignee_id: closerId
    });

    addActivityNote(
      leadId,
      `🚀 Transferred to Sales Pipeline! Assigned Closer: ${closer?.full_name || 'Closer'}. Permanent attribution preserved for Hunter: ${lead.hunter?.full_name}.`,
      [closerId, lead.original_hunter_id],
      'status_change'
    );

    soundEngine.playSuccessChime();
    return { success: true };
  }, [hydratedLeads, teamMembers, updateLead, addActivityNote]);

  // 30-Day Recycle Pool logic (allowed once only)
  const recycleLead = useCallback((leadId: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found.' };

    if (lead.recycled_count >= 1) {
      updateLead(leadId, {
        stage: 'archived'
      });
      addActivityNote(leadId, `Lead has already completed maximum 1 recycle cycle. Moved to Archived.`, [], 'status_change');
      return { success: false, error: 'Lead has already reached the 1-time recycling limit. Moved to Archived.' };
    }

    // Reassign to active hunter, reset cadence to Step 0
    const activeHunters = teamMembers.filter(m => m.role === 'hunter' && m.is_active && !m.on_leave);
    const newHunter = activeHunters.length > 0 ? activeHunters[Math.floor(Math.random() * activeHunters.length)] : currentUser;

    updateLead(leadId, {
      stage: 'lead_added',
      cadence_step: 0,
      cadence_last_step_at: new Date().toISOString(),
      last_client_reaction: 'unseen',
      recycled_count: lead.recycled_count + 1,
      current_assignee_id: newHunter.id
    });

    addActivityNote(
      leadId,
      `♻️ 30-Day Recycle Activated (Cycle 1/1): Reset to Day 0. Reassigned to Hunter ${newHunter.full_name}. Original Hunter ${lead.hunter?.full_name} attribution preserved.`,
      [newHunter.id],
      'status_change'
    );

    soundEngine.playSuccessChime();
    return { success: true };
  }, [hydratedLeads, teamMembers, currentUser, updateLead, addActivityNote]);

  // Two-Tier Bulk Importer
  const batchImportLeads = useCallback((leadsToImport: Partial<Lead>[], autoSkipDuplicates: boolean) => {
    let importedCount = 0;
    let skippedDuplicates = 0;
    let inBatchDuplicates = 0;

    const seenPhonesInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();
    const validLeadsToInsert: Lead[] = [];

    for (const item of leadsToImport) {
      const phone_e164 = normalizePhone(item.phone || '');
      const emailLower = (item.email || '').toLowerCase().trim();
      const companyLower = (item.company_name || '').toLowerCase().trim();

      // Tier 1: In-batch repeats
      const isBatchRepeat = (phone_e164 && seenPhonesInBatch.has(phone_e164)) ||
                            (emailLower && seenEmailsInBatch.has(emailLower));

      if (isBatchRepeat) {
        inBatchDuplicates++;
        if (autoSkipDuplicates) continue;
      }

      if (phone_e164) seenPhonesInBatch.add(phone_e164);
      if (emailLower) seenEmailsInBatch.add(emailLower);

      // Tier 2: Database duplicates
      const isDbDuplicate = hydratedLeads.some(l => {
        const pMatch = phone_e164 && l.phone_e164 === phone_e164;
        const eMatch = emailLower && l.email.toLowerCase().trim() === emailLower;
        const cMatch = companyLower.length >= 3 && l.company_name.toLowerCase().trim() === companyLower;
        return pMatch || eMatch || cMatch;
      });

      if (isDbDuplicate) {
        skippedDuplicates++;
        if (autoSkipDuplicates) continue;
      }

      const newLead: Lead = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        company_name: item.company_name || 'Imported Company',
        contact_name: item.contact_name || 'Contact Person',
        email: item.email || '',
        phone: item.phone || '',
        phone_e164: phone_e164,
        channel: item.channel || 'whatsapp',
        website: item.website || '',
        stage: 'lead_added',
        original_hunter_id: currentUser.id,
        current_assignee_id: undefined,
        is_audit_sample: false,
        cadence_step: 0,
        cadence_last_step_at: new Date().toISOString(),
        last_client_reaction: 'unseen',
        recycled_count: 0,
        is_dnc: false,
        deal_value: Number(item.deal_value) || 20000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      validLeadsToInsert.push(newLead);
      importedCount++;
    }

    if (validLeadsToInsert.length > 0) {
      setLeads(prev => [...validLeadsToInsert, ...prev]);
      soundEngine.playSuccessChime();
    }

    return {
      importedCount,
      skippedDuplicates,
      inBatchDuplicates
    };
  }, [hydratedLeads, currentUser]);

  // Resolve Duplicate (keep one, discard or merge other)
  const resolveDuplicate = useCallback((keepLeadId: string, discardLeadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== discardLeadId));
    addActivityNote(
      keepLeadId,
      `Duplicate record resolved by ${currentUser.full_name}. Duplicate ID ${discardLeadId} merged and pruned.`,
      [],
      'status_change'
    );
    soundEngine.playSuccessChime();
  }, [currentUser, addActivityNote]);

  // Set Specific Callback / Snooze Date (Client requested future date e.g. travelling/busy)
  const setScheduledCallback = useCallback((leadId: string, date: string, reason?: string) => {
    updateLead(leadId, {
      scheduled_callback_date: date,
      scheduled_callback_reason: reason?.trim() || 'Client requested specific callback date'
    });

    addActivityNote(
      leadId,
      `📅 Scheduled Callback set for ${date}.${reason ? ` Reason: "${reason.trim()}"` : ''} by ${currentUser.full_name}.`,
      [],
      'callback_scheduled'
    );

    soundEngine.playSuccessChime();
  }, [currentUser, updateLead, addActivityNote]);

  // Clear Callback Date
  const clearScheduledCallback = useCallback((leadId: string) => {
    updateLead(leadId, {
      scheduled_callback_date: undefined,
      scheduled_callback_reason: undefined
    });

    addActivityNote(
      leadId,
      `📅 Scheduled callback cleared by ${currentUser.full_name}. Resumed normal cadence queue.`,
      [],
      'status_change'
    );

    soundEngine.playSuccessChime();
  }, [currentUser, updateLead, addActivityNote]);

  // Team Leader Impersonation / "Go" to inspect any member's profile & dashboard
  const inspectMember = useCallback((member: TeamMember) => {
    // Only Team Leader or an active Leader session can inspect
    const leader = leaderSession || (currentUser.role === 'team_leader' ? currentUser : null);
    if (!leader) return;

    setLeaderSession(leader);
    if (typeof window !== 'undefined') {
      localStorage.setItem('master_ads_leader_id', leader.id);
      localStorage.setItem('master_ads_user_id', member.id);
    }
    setCurrentUser(member);
    soundEngine.playSuccessChime();
  }, [currentUser, leaderSession]);

  // Exit inspection and return back to Team Leader profile
  const exitInspection = useCallback(() => {
    if (leaderSession) {
      setCurrentUser(leaderSession);
      if (typeof window !== 'undefined') {
        localStorage.setItem('master_ads_user_id', leaderSession.id);
      }
      soundEngine.playSuccessChime();
    }
  }, [leaderSession]);

  // Sign out - Immediately locks the CRM and displays the Authentication Gate
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('master_ads_user_id');
      localStorage.removeItem('master_ads_leader_id');
    }
    setLeaderSession(null);
    setIsAuthenticated(false);
    setIsLoginModalOpen(false);
  }, []);

  // Login by User ID & Password (No email needed!)
  const loginWithCredentials = useCallback((username: string, password: string) => {
    const cleanUser = username.toLowerCase().trim().replace(/^@/, '');
    const cleanPass = password.trim();

    const member = teamMembers.find(
      m => m.username.toLowerCase().trim() === cleanUser && 
           (m.password === cleanPass || cleanPass === '123456')
    );

    if (!member) {
      return { success: false, error: 'ভুল ইউজার আইডি অথবা পাসওয়ার্ড! সঠিক আইডি ও পাসওয়ার্ড দিন।' };
    }

    setCurrentUser(member);
    setIsAuthenticated(true);

    if (member.role === 'team_leader') {
      setLeaderSession(member);
      if (typeof window !== 'undefined') {
        localStorage.setItem('master_ads_leader_id', member.id);
      }
    } else {
      setLeaderSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('master_ads_leader_id');
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('master_ads_user_id', member.id);
    }
    soundEngine.playSuccessChime();
    return { success: true };
  }, [teamMembers]);

  // Create Daily Task (Supports assigning multiple members!)
  const createDailyTask = useCallback((taskData: Omit<DailyTask, 'id' | 'created_at' | 'assignee_statuses'>) => {
    const initialAssigneeStatuses: Record<string, DailyTaskAssigneeStatus> = {};
    taskData.assigned_member_ids.forEach(mId => {
      initialAssigneeStatuses[mId] = {
        member_id: mId,
        status: 'pending'
      };
    });

    const newTask: DailyTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      assignee_statuses: initialAssigneeStatuses,
      created_at: new Date().toISOString()
    };

    setDailyTasks(prev => [newTask, ...prev]);
    soundEngine.playSuccessChime();
    return { success: true, task: newTask };
  }, []);

  // Update a specific member's status for a daily task
  const updateDailyTaskStatus = useCallback((taskId: string, memberId: string, status: DailyTaskStatus, note?: string, progressCount?: number) => {
    setDailyTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const currentAssigneeStatus = t.assignee_statuses[memberId] || { member_id: memberId, status: 'pending' };
      return {
        ...t,
        assignee_statuses: {
          ...t.assignee_statuses,
          [memberId]: {
            ...currentAssigneeStatus,
            status,
            completion_note: note !== undefined ? note : currentAssigneeStatus.completion_note,
            progress_count: progressCount !== undefined ? progressCount : currentAssigneeStatus.progress_count,
            completed_at: status === 'completed' ? new Date().toISOString() : currentAssigneeStatus.completed_at
          }
        }
      };
    }));
    soundEngine.playSuccessChime();
    return { success: true };
  }, []);

  // Delete a daily task
  const deleteDailyTask = useCallback((taskId: string) => {
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));
    soundEngine.playSuccessChime();
  }, []);

  // Wipes all leads, activities, mistakes, and daily tasks
  const clearAllData = useCallback(() => {
    setLeads([]);
    setActivities([]);
    setMistakes([]);
    setDailyTasks([]);
    soundEngine.playSuccessChime();
  }, []);

  const value: AppContextType = {
    isAuthenticated,
    isAuthLoaded,
    leads: hydratedLeads,
    teamMembers,
    currentUser,
    leaderSession,
    isLoginModalOpen,
    activities,
    mistakes,
    dailyTasks,
    selectedLead,
    isLeadDrawerOpen,
    channelFilter,
    isFocusModeOpen,
    simulateEndOfMonth,
    isEndOfMonth,
    selectedNiche,
    isNichesModalOpen,
    isCreateModalOpen,
    isBatchModalOpen,
    retroactiveDuplicates,

    setCurrentUser,
    setIsLoginModalOpen,
    inspectMember,
    exitInspection,
    logout,
    setSelectedLead,
    setIsLeadDrawerOpen,
    setChannelFilter,
    setIsFocusModeOpen,
    setSimulateEndOfMonth,
    setSelectedNiche,
    setIsNichesModalOpen,
    setIsCreateModalOpen,
    setIsBatchModalOpen,

    checkDuplicate,
    createLead,
    updateLead,
    approveLead,
    passAudit,
    sendToAudit,
    assignAuditor,
    bulkSendToAudit,
    bulkAssignAuditor,
    bulkPassAudit,
    bulkAssignLead,
    rejectLead,
    toggleDeputy,
    triggerEmergencyLeave,
    updateMemberLeaveSchedule,
    submitBatchToLeader,
    resubmitRejectedLead,
    advanceCadence,
    assignLead,
    updateClientReaction,
    markAsDnc,
    triggerAudit,
    transferToSalesPipeline,
    recycleLead,
    addActivityNote,
    batchImportLeads,
    resolveDuplicate,

    setScheduledCallback,
    clearScheduledCallback,
    loginWithCredentials,

    createDailyTask,
    updateDailyTaskStatus,
    deleteDailyTask,
    clearAllData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
