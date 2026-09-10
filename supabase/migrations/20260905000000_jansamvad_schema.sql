-- ==============================================================================
-- JANSAMVAD AI — Supabase Database Migration
-- Civic Grievance Intelligence & Tri-Party Resolution Platform for Jharkhand
-- ==============================================================================

-- 1. Enable pgcrypto / uuid extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLE 1: PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')) DEFAULT 'citizen',
  full_name TEXT,
  phone TEXT,
  district TEXT DEFAULT 'Ranchi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 2: DEPARTMENTS (Seed Demo Entities)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Demo Departments
INSERT INTO public.departments (code, name, description)
VALUES
  ('ROADS', 'Road Infrastructure Department', 'State road repairs, potholes, highway maintenance'),
  ('WATER', 'Water Supply Department', 'Municipal water pipelines, tap connections, pump maintenance'),
  ('POWER', 'Electricity Department', 'Power grid, street lighting, transformers, wire maintenance'),
  ('SANITATION', 'Sanitation Department', 'Garbage collection, waste management, public bins'),
  ('HEALTH', 'Health Department', 'Public health clinics, vector control, medical facilities'),
  ('EDUCATION', 'Education Department', 'Government schools, educational infrastructure'),
  ('DRAINAGE', 'Drainage Department', 'Stormwater drains, sewer lines, open gutter clearing'),
  ('SAFETY', 'Public Safety Department', 'Traffic safety, fire hazards, public zone surveillance'),
  ('OTHER', 'General Civic Administration', 'Public grievances across civic domains')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ==============================================================================
-- TABLE 3: OFFICERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  district TEXT NOT NULL DEFAULT 'Ranchi',
  badge_number TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 4: ISSUES
-- Allowed statuses:
-- reported, ai_verified, routed, officer_assigned, accepted, work_started,
-- resolved_awaiting_verification, resolved, escalated, rejected
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  district TEXT NOT NULL,
  location_text TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported', 'ai_verified', 'routed', 'officer_assigned', 'accepted',
    'work_started', 'resolved_awaiting_verification', 'resolved', 'escalated', 'rejected'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
  severity TEXT NOT NULL DEFAULT 'Medium',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_count INTEGER NOT NULL DEFAULT 1,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  citizen_verification BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for speedy geo & status queries
CREATE INDEX IF NOT EXISTS idx_issues_district ON public.issues(district);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_public_id ON public.issues(public_id);

-- ==============================================================================
-- TABLE 5: ISSUE_REPORTS
-- Multiple citizen reports can belong to one civic issue (One Issue = Many Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  urgency TEXT DEFAULT 'Normal',
  source_language TEXT DEFAULT 'English',
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  similarity_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_issue_id ON public.issue_reports(issue_id);

-- ==============================================================================
-- TABLE 6: ISSUE_ASSIGNMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ==============================================================================
-- TABLE 7: ISSUE_STATUS_HISTORY (Timeline)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_issue_id ON public.issue_status_history(issue_id);

-- ==============================================================================
-- TABLE 8: AI_ANALYSIS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  spam_score INTEGER NOT NULL DEFAULT 0,
  detected_category TEXT,
  category_confidence NUMERIC,
  detected_language TEXT,
  severity TEXT,
  priority TEXT,
  priority_score INTEGER,
  department_name TEXT,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 9: EVIDENCE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('initial_report', 'before', 'after', 'resolution_doc')) DEFAULT 'initial_report',
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- 1. Departments: Everyone can read
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);

-- 2. Issues:
-- Everyone can read issues (Public transparency)
CREATE POLICY "Public read issues" ON public.issues FOR SELECT USING (true);
-- Anyone (including anon citizens) can insert an issue
CREATE POLICY "Citizens create issues" ON public.issues FOR INSERT WITH CHECK (true);
-- Updates allowed for status transitions and count increments
CREATE POLICY "Allow issue updates" ON public.issues FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Issue Reports:
-- Citizens can view their own reports, officers/admins can view all reports
CREATE POLICY "Read reports" ON public.issue_reports FOR SELECT USING (
  auth.uid() IS NULL OR reporter_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'admin')
  )
);
-- Anyone can insert reports
CREATE POLICY "Insert reports" ON public.issue_reports FOR INSERT WITH CHECK (true);

-- 4. Issue Status History (Timeline):
-- Everyone can read the timeline for transparency
CREATE POLICY "Public read issue timeline" ON public.issue_status_history FOR SELECT USING (true);
CREATE POLICY "Insert status history" ON public.issue_status_history FOR INSERT WITH CHECK (true);

-- 5. Officers & Assignments:
CREATE POLICY "Public read officers" ON public.officers FOR SELECT USING (true);
CREATE POLICY "Public read assignments" ON public.issue_assignments FOR SELECT USING (true);
CREATE POLICY "Manage assignments" ON public.issue_assignments FOR ALL USING (true);

-- 6. Evidence:
CREATE POLICY "Public read evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Insert evidence" ON public.evidence FOR INSERT WITH CHECK (true);

-- 7. AI Analysis:
CREATE POLICY "Public read ai analysis" ON public.ai_analysis FOR SELECT USING (true);
CREATE POLICY "Insert ai analysis" ON public.ai_analysis FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKET: issue-evidence
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-evidence', 'issue-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read issue evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-evidence');

CREATE POLICY "Allow authenticated or anon upload to issue-evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'issue-evidence');
