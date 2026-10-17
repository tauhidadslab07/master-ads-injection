export type TeamRole = 
  | 'team_leader' 
  | 'deputy' 
  | 'hunter' 
  | 'outreach_specialist' 
  | 'sales_closer';

export type LeadStage = 
  | 'lead_added'
  | 'pending_approval'
  | 'approved'
  | 'contacted'
  | 'replied'
  | 'audit'
  | 'sales_pipeline'
  | 'cold'
  | 'recycle_pool'
  | 'archived'
  | 'closed_won'
  | 'closed_lost';

export type OutreachChannel = 'whatsapp' | 'email' | 'call' | 'linkedin';

export type ClientReaction = 
  | 'unseen' 
  | 'seen' 
  | 'replied' 
  | 'interested' 
  | 'not_interested' 
  | 'objection';

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: TeamRole;
  is_deputy: boolean;
  is_active: boolean;
  on_leave: boolean;
  consecutive_approvals: number;
  is_trusted_hunter: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  phone_e164: string;
  channel: OutreachChannel;
  website?: string;
  stage: LeadStage;
  rejection_reason?: string;
  
  // Attribution & Ownership
  original_hunter_id: string;
  current_assignee_id: string;
  hunter?: TeamMember;
  assignee?: TeamMember;
  
  // Approval Gate & Trusted Mode
  is_audit_sample: boolean;
  approved_at?: string;
  approved_by?: string;
  
  // Cadence Engine
  cadence_step: number; // 0..4 (Day 0, Day 2, Day 5, Day 9, Day 14)
  cadence_last_step_at?: string;
  last_client_reaction: ClientReaction;
  recycled_count: number;
  
  // DNC Hard-Lock
  is_dnc: boolean;
  dnc_marked_at?: string;
  dnc_reason?: string;
  
  deal_value: number;
  created_at: string;
  updated_at: string;

  // UI helpers
  duplicateMatchReasons?: string[];
  isDuplicateFlag?: boolean;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  author_id: string;
  activity_type: 'note' | 'cadence_advance' | 'status_change' | 'approval' | 'rejection' | 'dnc' | 'mistake';
  content: string;
  mentions?: string[]; // user IDs
  created_at: string;
  author?: TeamMember;
}

export interface MemberActivityMistake {
  id: string;
  lead_id: string;
  member_id: string;
  mistake_type: string;
  description: string;
  attempted_action: string;
  created_at: string;
  lead?: Lead;
  member?: TeamMember;
}

export interface DuplicateMatch {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  phone_e164: string;
  stage: LeadStage;
  hunter_name: string;
  hunter_phone: string;
  match_reasons: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
  offendingFields: {
    phone?: boolean;
    email?: boolean;
    company?: boolean;
  };
}

export interface CadenceDefinition {
  step: number;
  dayLabel: string;
  daysAfterStart: number;
  channel: OutreachChannel;
  description: string;
}

export const CADENCE_STEPS: CadenceDefinition[] = [
  { step: 0, dayLabel: 'Day 0', daysAfterStart: 0, channel: 'whatsapp', description: 'Initial Introduction & Value Hook via WhatsApp' },
  { step: 1, dayLabel: 'Day 2', daysAfterStart: 2, channel: 'email', description: 'Case Study & Proof Audit via Email' },
  { step: 2, dayLabel: 'Day 5', daysAfterStart: 5, channel: 'whatsapp', description: 'Quick Follow-up & Voice Note / Quick Loom on WhatsApp' },
  { step: 3, dayLabel: 'Day 9', daysAfterStart: 9, channel: 'email', description: 'Breakdown of Injected Competitor Ads via Email' },
  { step: 4, dayLabel: 'Day 14', daysAfterStart: 14, channel: 'whatsapp', description: 'Final Breakup / Free Audit Offer on WhatsApp' },
];
