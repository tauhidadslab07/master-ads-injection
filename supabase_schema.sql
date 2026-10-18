-- ========================================================
-- MASTER ADS INJECTION CRM: SUPABASE POSTGRESQL SCHEMA
-- Execute this script in your Supabase SQL Editor
-- Project URL: https://pctqvnhhfzispsscwtme.supabase.co
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT '123456',
    role TEXT NOT NULL DEFAULT 'hunter',
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deputy BOOLEAN DEFAULT FALSE,
    consecutive_approvals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Leads Table (Outreach, Audited & Sales Pipeline)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone_e164 TEXT,
    website TEXT,
    niche TEXT DEFAULT 'dtc',
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    stage TEXT NOT NULL DEFAULT 'lead_added',
    cadence_step INTEGER DEFAULT 0,
    last_client_reaction TEXT DEFAULT 'unseen',
    deal_value NUMERIC DEFAULT 25000,
    original_hunter_id TEXT REFERENCES team_members(id),
    current_assignee_id TEXT REFERENCES team_members(id),
    is_dnc BOOLEAN DEFAULT FALSE,
    dnc_reason TEXT,
    scheduled_callback_date TEXT,
    scheduled_callback_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Assigned Tasks Table (Team Leader Dispatcher)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'lead_hunting',
    priority TEXT NOT NULL DEFAULT 'high',
    target_count INTEGER DEFAULT 20,
    target_date TEXT NOT NULL,
    assigned_by_id TEXT REFERENCES team_members(id),
    assigned_member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    assignee_statuses JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Lead Activity Notes & Cadence History
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    author_id TEXT REFERENCES team_members(id),
    activity_type TEXT NOT NULL DEFAULT 'note',
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Member Quality & Mistake Tracking
CREATE TABLE IF NOT EXISTS mistakes (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES team_members(id),
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    mistake_type TEXT NOT NULL,
    description TEXT NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Disable Row-Level-Security (RLS) for seamless team API access, or add permissive public policies
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes DISABLE ROW LEVEL SECURITY;

-- 8. Enable Realtime Publications for Live Sync across multiple devices
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
