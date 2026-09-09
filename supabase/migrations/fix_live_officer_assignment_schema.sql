-- ==============================================================================
-- JANSAMVAD AI — JHARKHAND CIVIC GRIEVANCE REDRESSAL SYSTEM
-- Migration: fix_live_officer_assignment_schema.sql
-- 
-- Synchronizes live Supabase database schema with the frontend application:
-- 1. Departments table & seed data
-- 2. Officers table with department foreign key, badge, and active status
-- 3. Issues table: adds assigned_officer_id with foreign key to officers(id)
-- 4. Issue Assignments table with unique(issue_id), timestamps, and notes
-- 5. Normalizes issue_status_history to: issue_id, status, actor_type, note, created_at
-- 6. Adds indexes for high performance querying
-- 7. Enables RLS policies for public civic access
-- 8. Seeds active demo officers with deterministic UUIDs if table is empty
-- 9. Preserves all existing issues and grievances
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. DEPARTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  head TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS head TEXT;

-- Seed / Update Departments
INSERT INTO public.departments (code, name, description, head)
VALUES
  ('ROADS', 'Road Infrastructure Department', 'State road repairs, potholes, highway and lane maintenance', 'Er. A. K. Sinha, Chief Engineer'),
  ('WATER', 'Water Supply Department', 'Municipal water pipelines, tap connections, pump maintenance', 'Shri R. P. Verma, Superintending Engineer'),
  ('POWER', 'Electricity Department', 'Power grid, street lighting, transformers, wire maintenance', 'Er. S. K. Mahato, Executive Engineer'),
  ('SANITATION', 'Sanitation Department', 'Garbage collection, waste management, public bins', 'Dr. Manisha Kujur, Municipal Health Officer'),
  ('HEALTH', 'Health Department', 'Public health clinics, vector control, medical facilities', 'Dr. P. Tirkey, Civil Surgeon'),
  ('EDUCATION', 'Education Department', 'Government schools, educational infrastructure', 'Smt. Anjali Minz, District Education Officer'),
  ('DRAINAGE', 'Drainage Department', 'Stormwater drains, sewer lines, open gutter clearing', 'Er. B. N. Singh, Drainage Executive Engineer'),
  ('SAFETY', 'Public Safety Department', 'Traffic safety, fire hazards, public zone surveillance', 'Shri V. S. Chauhan, Joint Director'),
  ('OTHER', 'General Civic Administration', 'Public grievances across civic domains', 'Deputy Municipal Commissioner')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = COALESCE(EXCLUDED.description, public.departments.description),
  head = COALESCE(EXCLUDED.head, public.departments.head);

-- ==============================================================================
-- 2. OFFICERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  district TEXT NOT NULL DEFAULT 'Ranchi',
  badge_number TEXT,
  designation TEXT DEFAULT 'Field Officer',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS badge_number TEXT;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Field Officer';
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Ensure unique constraint on user_id if column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'officers_user_id_unique'
  ) THEN
    ALTER TABLE public.officers ADD CONSTRAINT officers_user_id_unique UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- 3. ISSUES TABLE (assigned_officer_id column and foreign key)
-- ==============================================================================
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_officer_id UUID;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'issues_assigned_officer_id_fkey'
  ) THEN
    ALTER TABLE public.issues
      ADD CONSTRAINT issues_assigned_officer_id_fkey
      FOREIGN KEY (assigned_officer_id) REFERENCES public.officers(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- 4. ISSUE_ASSIGNMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'assigned';
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enforce unique constraint on issue_id so one issue has one active assignment record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'issue_assignments_issue_unique'
  ) THEN
    -- If duplicate rows exist, keep newest
    DELETE FROM public.issue_assignments a
    USING public.issue_assignments b
    WHERE a.issue_id = b.issue_id AND a.assigned_at < b.assigned_at;

    ALTER TABLE public.issue_assignments
      ADD CONSTRAINT issue_assignments_issue_unique UNIQUE (issue_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- 5. NORMALIZE ISSUE_STATUS_HISTORY TABLE
-- Standard schema: id, issue_id, status, actor_type, note, created_at
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  actor_type TEXT DEFAULT 'citizen',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.issue_status_history ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'citizen';
ALTER TABLE public.issue_status_history ADD COLUMN IF NOT EXISTS note TEXT;

-- ==============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_issues_assigned_officer ON public.issues(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_issue_id ON public.issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_assignments_officer_id ON public.issue_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_status_history_issue_id ON public.issue_status_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_officers_department_id ON public.officers(department_id);
CREATE INDEX IF NOT EXISTS idx_officers_active ON public.officers(active);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_status_history ENABLE ROW LEVEL SECURITY;

-- Departments RLS
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Manage departments" ON public.departments;
CREATE POLICY "Manage departments" ON public.departments FOR ALL USING (true);

-- Officers RLS: Public read, insert/update
DROP POLICY IF EXISTS "Public read officers" ON public.officers;
CREATE POLICY "Public read officers" ON public.officers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Manage officers" ON public.officers;
CREATE POLICY "Manage officers" ON public.officers FOR ALL USING (true);

-- Issues RLS: Public read, citizen insert, public update for status/officer assignments
DROP POLICY IF EXISTS "Public read issues" ON public.issues;
CREATE POLICY "Public read issues" ON public.issues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow issue updates" ON public.issues;
CREATE POLICY "Allow issue updates" ON public.issues FOR UPDATE USING (true) WITH CHECK (true);

-- Issue Assignments RLS: Public read and write
DROP POLICY IF EXISTS "Public read assignments" ON public.issue_assignments;
CREATE POLICY "Public read assignments" ON public.issue_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Manage assignments" ON public.issue_assignments;
CREATE POLICY "Manage assignments" ON public.issue_assignments FOR ALL USING (true);

-- Issue Status History RLS: Public read and insert
DROP POLICY IF EXISTS "Public read issue timeline" ON public.issue_status_history;
CREATE POLICY "Public read issue timeline" ON public.issue_status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert status history" ON public.issue_status_history;
CREATE POLICY "Insert status history" ON public.issue_status_history FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 8. SEED REAL JHARKHAND OFFICERS (Deterministic UUIDs)
-- ==============================================================================
DO $$
DECLARE
  v_count INT;
  v_roads UUID;
  v_water UUID;
  v_power UUID;
  v_sanitation UUID;
  v_drainage UUID;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.officers;
  IF v_count = 0 THEN
    SELECT id INTO v_roads FROM public.departments WHERE code = 'ROADS' LIMIT 1;
    SELECT id INTO v_water FROM public.departments WHERE code = 'WATER' LIMIT 1;
    SELECT id INTO v_power FROM public.departments WHERE code = 'POWER' LIMIT 1;
    SELECT id INTO v_sanitation FROM public.departments WHERE code = 'SANITATION' LIMIT 1;
    SELECT id INTO v_drainage FROM public.departments WHERE code = 'DRAINAGE' LIMIT 1;

    INSERT INTO public.officers (id, department_id, name, phone, district, badge_number, designation, active)
    VALUES
      ('a1111111-1111-4111-8111-111111111111', v_roads, 'Ramesh Kumar Verma', '+91 94311 02931', 'Ranchi', 'JH-RNC-402', 'Executive Engineer', true),
      ('b2222222-2222-4222-8222-222222222222', v_water, 'Sunita Soren', '+91 94313 88120', 'Jamshedpur', 'JH-JSR-108', 'Water Works Inspector', true),
      ('c3333333-3333-4333-8333-333333333333', v_power, 'Amitabh Ghosh', '+91 94315 44921', 'Dhanbad', 'JH-DHN-219', 'Sub-Divisional Officer', true),
      ('d4444444-4444-4444-8444-444444444444', v_sanitation, 'Dr. Priyanka Kispotta', '+91 94317 66234', 'Ranchi', 'JH-RNC-801', 'Chief Sanitation Officer', true),
      ('e5555555-5555-4555-8555-555555555555', v_drainage, 'Rajeshwar Soren', '+91 94318 11990', 'Bokaro', 'JH-BOK-305', 'Assistant Drainage Engineer', true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      district = EXCLUDED.district,
      badge_number = EXCLUDED.badge_number,
      designation = EXCLUDED.designation,
      active = EXCLUDED.active;
  END IF;
END $$;

-- ==============================================================================
-- 9. SUPABASE REALTIME PUBLICATION
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_assignments;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_status_history;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.officers;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
