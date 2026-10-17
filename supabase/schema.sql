-- =========================================================================
-- MASTER ADS INJECTION - ENTERPRISE CRM & OUTREACH OPERATIONS ENGINE
-- PRODUCTION SUPABASE SCHEMA, CONSTRAINTS, RPCs & CLEAN MIGRATION
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop legacy conflicting tables and types if they existed from older tests
DROP TABLE IF EXISTS member_activity_mistakes CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

DROP TYPE IF EXISTS team_role CASCADE;
DROP TYPE IF EXISTS lead_stage CASCADE;
DROP TYPE IF EXISTS outreach_channel CASCADE;
DROP TYPE IF EXISTS client_reaction CASCADE;

-- 1. ENUMS
CREATE TYPE team_role AS ENUM (
  'team_leader',
  'deputy',
  'hunter',
  'outreach_specialist',
  'sales_closer'
);

CREATE TYPE lead_stage AS ENUM (
  'lead_added',
  'pending_approval',
  'approved',
  'contacted',
  'replied',
  'audit',
  'sales_pipeline',
  'cold',
  'recycle_pool',
  'archived',
  'closed_won',
  'closed_lost'
);

CREATE TYPE outreach_channel AS ENUM (
  'whatsapp',
  'email',
  'call',
  'linkedin'
);

CREATE TYPE client_reaction AS ENUM (
  'unseen',
  'seen',
  'replied',
  'interested',
  'not_interested',
  'objection'
);

-- 2. TEAM MEMBERS TABLE
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'hunter',
  is_deputy BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  on_leave BOOLEAN NOT NULL DEFAULT false,
  consecutive_approvals INTEGER NOT NULL DEFAULT 0,
  is_trusted_hunter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. LEADS TABLE
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  channel outreach_channel NOT NULL DEFAULT 'whatsapp',
  website TEXT,
  stage lead_stage NOT NULL DEFAULT 'lead_added',
  rejection_reason TEXT,
  
  -- Attribution & Ownership
  original_hunter_id UUID NOT NULL REFERENCES team_members(id),
  current_assignee_id UUID NOT NULL REFERENCES team_members(id),
  
  -- Approval & Quality Gate
  is_audit_sample BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES team_members(id),
  
  -- Cadence Engine & Recycle
  cadence_step INTEGER NOT NULL DEFAULT 0,
  cadence_last_step_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  last_client_reaction client_reaction NOT NULL DEFAULT 'unseen',
  recycled_count INTEGER NOT NULL DEFAULT 0,
  
  -- Safety & Hard Lock
  is_dnc BOOLEAN NOT NULL DEFAULT false,
  dnc_marked_at TIMESTAMPTZ,
  dnc_reason TEXT,
  
  deal_value NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance & deduplication
CREATE INDEX idx_leads_phone_e164 ON leads(phone_e164);
CREATE INDEX idx_leads_email_lower ON leads(LOWER(TRIM(email)));
CREATE INDEX idx_leads_company_lower ON leads(LOWER(TRIM(company_name)));
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_assignee ON leads(current_assignee_id);
CREATE INDEX idx_leads_hunter ON leads(original_hunter_id);

-- 4. ACTIVITY NOTES TABLE
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES team_members(id),
  activity_type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_activities_lead ON lead_activities(lead_id);

-- 5. MISTAKE GUARD AUDIT LOG
CREATE TABLE member_activity_mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES team_members(id),
  mistake_type TEXT NOT NULL,
  description TEXT NOT NULL,
  attempted_action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Row Level Security (RLS) Policies (Full read/write for authenticated and anon client)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activity_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to lead_activities" ON lead_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to member_activity_mistakes" ON member_activity_mistakes FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- ENTERPRISE RPC: check_duplicate_lead
-- =========================================================================
CREATE OR REPLACE FUNCTION check_duplicate_lead(
  p_phone_e164 TEXT,
  p_email TEXT,
  p_company_name TEXT,
  p_exclude_lead_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_matching_leads JSONB;
  v_sanitized_phone TEXT := TRIM(COALESCE(p_phone_e164, ''));
  v_sanitized_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
  v_sanitized_company TEXT := LOWER(TRIM(COALESCE(p_company_name, '')));
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'company_name', l.company_name,
      'contact_name', l.contact_name,
      'email', l.email,
      'phone', l.phone,
      'phone_e164', l.phone_e164,
      'stage', l.stage,
      'original_hunter_id', l.original_hunter_id,
      'hunter_name', tm.full_name,
      'hunter_phone', tm.phone,
      'match_reasons', ARRAY_REMOVE(ARRAY[
        CASE WHEN v_sanitized_phone <> '' AND l.phone_e164 = v_sanitized_phone THEN 'Phone (' || l.phone || ')' ELSE NULL END,
        CASE WHEN v_sanitized_email <> '' AND LOWER(TRIM(l.email)) = v_sanitized_email THEN 'Email (' || l.email || ')' ELSE NULL END,
        CASE WHEN LENGTH(v_sanitized_company) >= 3 AND LOWER(TRIM(l.company_name)) = v_sanitized_company THEN 'Company (' || l.company_name || ')' ELSE NULL END
      ], NULL)
    )
  )
  INTO v_matching_leads
  FROM leads l
  JOIN team_members tm ON tm.id = l.original_hunter_id
  WHERE (p_exclude_lead_id IS NULL OR l.id <> p_exclude_lead_id)
    AND (
      (v_sanitized_phone <> '' AND l.phone_e164 = v_sanitized_phone)
      OR (v_sanitized_email <> '' AND LOWER(TRIM(l.email)) = v_sanitized_email)
      OR (LENGTH(v_sanitized_company) >= 3 AND LOWER(TRIM(l.company_name)) = v_sanitized_company)
    );

  RETURN COALESCE(v_matching_leads, '[]'::jsonb);
END;
$$;

-- =========================================================================
-- ENTERPRISE RPC: trigger_emergency_leave_and_reassign
-- =========================================================================
CREATE OR REPLACE FUNCTION trigger_emergency_leave_and_reassign(
  p_member_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_members UUID[];
  v_active_count INTEGER;
  v_lead_id UUID;
  v_assigned_to UUID;
  v_index INTEGER := 0;
  v_reassigned_count INTEGER := 0;
BEGIN
  -- Mark member as on leave
  UPDATE team_members
  SET on_leave = true, is_active = false
  WHERE id = p_member_id;

  -- Get active members eligible for reassignment
  SELECT ARRAY_AGG(id)
  INTO v_active_members
  FROM team_members
  WHERE id <> p_member_id AND is_active = true AND on_leave = false;

  v_active_count := ARRAY_LENGTH(v_active_members, 1);

  IF v_active_count IS NULL OR v_active_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No active members available for round-robin reassignment.'
    );
  END IF;

  -- Reassign open leads
  FOR v_lead_id IN
    SELECT id FROM leads
    WHERE current_assignee_id = p_member_id
      AND stage NOT IN ('closed_won', 'closed_lost', 'archived')
  LOOP
    v_assigned_to := v_active_members[(v_index % v_active_count) + 1];
    
    UPDATE leads
    SET current_assignee_id = v_assigned_to,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_lead_id;

    -- Log reassignment activity note
    INSERT INTO lead_activities (lead_id, author_id, activity_type, content)
    VALUES (
      v_lead_id,
      p_member_id,
      'status_change',
      'Emergency Leave Reassignment: Lead round-robin reassigned. Original hunter attribution preserved.'
    );

    v_index := v_index + 1;
    v_reassigned_count := v_reassigned_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'reassigned_count', v_reassigned_count,
    'distributed_across', v_active_count
  );
END;
$$;
