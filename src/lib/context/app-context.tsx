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
  LeadStage
} from '@/types/crm';
import { INITIAL_TEAM_MEMBERS, INITIAL_LEADS, INITIAL_ACTIVITIES, INITIAL_MISTAKES } from '@/lib/mock-data';
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
  retroactiveDuplicates: { lead: Lead; conflictingLeads: Lead[]; reasons: string[] }[];
  
  // Actions
  setCurrentUser: (member: TeamMember) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setIsLeadDrawerOpen: (open: boolean) => void;
  setChannelFilter: (channel: 'all' | 'whatsapp' | 'email') => void;
  setIsFocusModeOpen: (open: boolean) => void;
  setSimulateEndOfMonth: (simulate: boolean) => void;
  
  // Lead Operations
  checkDuplicate: (phone: string, email: string, company: string, excludeId?: string) => Promise<DuplicateCheckResult>;
  createLead: (leadData: Partial<Lead>, allowDuplicateAnyway?: boolean, initialNote?: string) => { success: boolean; lead?: Lead; error?: string };
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  
  // Approval Gate & Trusted Hunter
  approveLead: (leadId: string) => { success: boolean; message: string };
  rejectLead: (leadId: string, reason: string) => { success: boolean; message: string };
  toggleDeputy: (memberId: string) => void;
  
  // Emergency Leave / Offboarding
  triggerEmergencyLeave: (memberId: string) => Promise<{ success: boolean; reassignedCount: number }>;
  
  // Cadence & Mistake Guard
  advanceCadence: (leadId: string, currentReaction?: ClientReaction) => { success: boolean; error?: string };
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [activities, setActivities] = useState<LeadActivity[]>(INITIAL_ACTIVITIES);
  const [mistakes, setMistakes] = useState<MemberActivityMistake[]>(INITIAL_MISTAKES);
  
  // Default logged in user: Sophia Sterling (Team Leader)
  const [currentUser, setCurrentUser] = useState<TeamMember>(INITIAL_TEAM_MEMBERS[0]);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState<boolean>(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [isFocusModeOpen, setIsFocusModeOpen] = useState<boolean>(false);
  const [simulateEndOfMonth, setSimulateEndOfMonth] = useState<boolean>(false);

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

  // Hydrate leads with full hunter and assignee objects
  const hydratedLeads = useMemo(() => {
    return leads.map(l => ({
      ...l,
      hunter: teamMembers.find(m => m.id === l.original_hunter_id),
      assignee: teamMembers.find(m => m.id === l.current_assignee_id)
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
    const hunter = teamMembers.find(m => m.id === hunterId);

    // Trusted Hunter Mode: 20 consecutive approvals grants auto-approval
    // With a 10% random review sample
    let initialStage: LeadStage = 'pending_approval';
    let isAuditSample = false;

    if (hunter) {
      if (hunter.role === 'team_leader' || hunter.is_deputy) {
        initialStage = 'approved';
      } else if (hunter.is_trusted_hunter || hunter.consecutive_approvals >= 20) {
        // 10% random quality review sample
        const isRandomAudit = Math.random() < 0.10;
        if (isRandomAudit) {
          initialStage = 'pending_approval';
          isAuditSample = true;
        } else {
          initialStage = 'approved';
        }
      } else {
        initialStage = 'pending_approval';
      }
    }

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
      current_assignee_id: hunterId,
      is_audit_sample: isAuditSample,
      approved_at: initialStage === 'approved' ? new Date().toISOString() : undefined,
      approved_by: initialStage === 'approved' ? currentUser.id : undefined,
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
    const noteText = initialStage === 'approved'
      ? `Lead created and auto-approved (Trusted Hunter Streak: ${hunter?.consecutive_approvals || 0}). Ready for cadence outreach.`
      : isAuditSample
      ? `Lead created by trusted hunter but flagged for 🎲 10% Quality Audit Sample. Pending review.`
      : `Lead created and queued for Team Leader / Deputy approval gate.`;

    addActivityNote(newLead.id, noteText, [], 'status_change');

    // Add user's custom context note if provided
    if (initialNote && initialNote.trim()) {
      addActivityNote(newLead.id, `📝 Initial Context Note:\n${initialNote.trim()}`, [], 'note');
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



  // Leader / Deputy Approval Gate
  const approveLead = useCallback((leadId: string) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    const canApprove = currentUser.role === 'team_leader' || currentUser.is_deputy;
    if (!canApprove) {
      return { success: false, message: 'Only Team Leader or Deputy can approve leads.' };
    }

    // Increment consecutive approvals for the hunter
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

    updateLead(leadId, {
      stage: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: currentUser.id,
      rejection_reason: undefined
    });

    addActivityNote(
      leadId,
      `Lead approved by ${currentUser.full_name} (${currentUser.role === 'team_leader' ? 'Team Leader' : 'Deputy'}). Moved to Approved queue.`,
      [lead.original_hunter_id],
      'approval'
    );

    soundEngine.playSuccessChime();
    return { success: true, message: 'Lead approved successfully.' };
  }, [hydratedLeads, currentUser, updateLead, addActivityNote]);

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

  // Cadence Step Advancement with Mistake Guard Hard-Lock
  const advanceCadence = useCallback((leadId: string, explicitReaction?: ClientReaction) => {
    const lead = hydratedLeads.find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found.' };

    const reaction = explicitReaction || lead.last_client_reaction;

    // Mistake Guard: Advancing follow-up without updating client reaction is blocked
    if (!reaction || reaction === 'unseen') {
      const mistakeRecord: MemberActivityMistake = {
        id: `mst-${Date.now()}`,
        lead_id: leadId,
        member_id: currentUser.id,
        mistake_type: 'cadence_advanced_without_reaction',
        description: `Blocked: Attempted to advance cadence step to Step ${lead.cadence_step + 1} while client reaction was still marked as "Unseen".`,
        attempted_action: `Advance Cadence (Step ${lead.cadence_step} -> Step ${lead.cadence_step + 1})`,
        created_at: new Date().toISOString()
      };

      setMistakes(prev => [mistakeRecord, ...prev]);
      soundEngine.playWarningChime();

      addActivityNote(
        leadId,
        `⚠️ Mistake Guard Triggered: Blocked cadence advance because client reaction has not been logged yet.`,
        [],
        'mistake'
      );

      return {
        success: false,
        error: '🛡️ Mistake Guard Block: You cannot advance cadence without logging client reaction (Seen, Replied, Interested, etc.). Mistake logged to audit log.'
      };
    }

    const nextStep = lead.cadence_step + 1;
    let nextStage = lead.stage;

    // Day 14 (step 4) reached with no reply -> move to Cold
    if (nextStep >= 5 && lead.last_client_reaction !== 'replied' && lead.last_client_reaction !== 'interested') {
      nextStage = 'cold';
    } else if (lead.stage === 'approved' || lead.stage === 'lead_added') {
      nextStage = 'contacted';
    }

    updateLead(leadId, {
      cadence_step: Math.min(nextStep, 5),
      cadence_last_step_at: new Date().toISOString(),
      stage: nextStage
    });

    addActivityNote(
      leadId,
      `Cadence advanced to Step ${nextStep}. Client reaction verified: [${reaction}].`,
      [],
      'cadence_advance'
    );

    soundEngine.playSuccessChime();
    return { success: true };
  }, [hydratedLeads, currentUser, updateLead, addActivityNote]);

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
        stage: 'pending_approval',
        original_hunter_id: currentUser.id,
        current_assignee_id: currentUser.id,
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

  const value: AppContextType = {
    leads: hydratedLeads,
    teamMembers,
    currentUser,
    activities,
    mistakes,
    selectedLead,
    isLeadDrawerOpen,
    channelFilter,
    isFocusModeOpen,
    simulateEndOfMonth,
    isEndOfMonth,
    retroactiveDuplicates,

    setCurrentUser,
    setSelectedLead,
    setIsLeadDrawerOpen,
    setChannelFilter,
    setIsFocusModeOpen,
    setSimulateEndOfMonth,

    checkDuplicate,
    createLead,
    updateLead,
    approveLead,
    rejectLead,
    toggleDeputy,
    triggerEmergencyLeave,
    advanceCadence,
    updateClientReaction,
    markAsDnc,
    triggerAudit,
    transferToSalesPipeline,
    recycleLead,
    addActivityNote,
    batchImportLeads,
    resolveDuplicate
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
