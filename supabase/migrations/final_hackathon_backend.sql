-- ==============================================================================
-- JANSAMVAD AI — JHARKHAND CIVIC GRIEVANCE INTELLIGENCE SYSTEM
-- FINAL HACKATHON BACKEND MIGRATION
-- File: supabase/migrations/final_hackathon_backend.sql
-- 
-- Rerun-safe, idempotent, production-grade schema:
-- 1. EXTENSIONS
-- 2. ROLES / PROFILES
-- 3. DEPARTMENTS
-- 4. OFFICERS
-- 5. ISSUES
-- 6. ISSUE_REPORTS
-- 7. ISSUE_ASSIGNMENTS
-- 8. ISSUE_STATUS_HISTORY
-- 9. AI_ANALYSIS
-- 10. EVIDENCE
-- 11. INDEXES
-- 12. TRIGGERS
-- 13. SECURE RPCS
-- 14. RLS POLICIES
-- 15. STORAGE POLICIES
-- 16. SEED DATA (IF EMPTY)
-- 17. REALTIME SETUP
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ROLES / PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
  full_name TEXT,
  phone TEXT,
  district TEXT DEFAULT 'Ranchi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist idempotently
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'citizen';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Ranchi';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Auto-sync profile on new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'citizen';
  v_full_name TEXT;
BEGIN
  -- Infer role from user metadata or email conventions
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := NEW.raw_user_meta_data->>'role';
  ELSIF NEW.email LIKE '%admin%' THEN
    v_role := 'admin';
  ELSIF NEW.email LIKE '%officer%' THEN
    v_role := 'officer';
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(COALESCE(NEW.email, 'citizen'), '@', 1)
  );

  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    v_role,
    v_full_name,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions for Role-Based Access Control
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'citizen');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_officer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.current_user_role() IN ('officer', 'admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. DEPARTMENTS
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

-- ==============================================================================
-- 4. OFFICERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  district TEXT NOT NULL DEFAULT 'Ranchi',
  badge_number TEXT,
  designation TEXT DEFAULT 'Field Inspector',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS badge_number TEXT;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Field Inspector';
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- ==============================================================================
-- 5. ISSUES (Master Civic Issues Table)
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
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS citizen_verification BOOLEAN DEFAULT NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS duplicate_count INTEGER NOT NULL DEFAULT 0;

-- ==============================================================================
-- 6. ISSUE_REPORTS (Consolidated Citizen Complaints linked to Master Issues)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
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

ALTER TABLE public.issue_reports ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.issue_reports ADD COLUMN IF NOT EXISTS similarity_score NUMERIC DEFAULT 0;
ALTER TABLE public.issue_reports ADD COLUMN IF NOT EXISTS source_language TEXT DEFAULT 'English';

-- Unique constraint: A citizen cannot repeatedly support the same issue
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_citizen_issue_report
  ON public.issue_reports (issue_id, reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;

-- ==============================================================================
-- 7. ISSUE_ASSIGNMENTS (Department Dispatch Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  notes TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.issue_assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ==============================================================================
-- 8. ISSUE_STATUS_HISTORY (Immutable Tri-Party Audit Timeline)
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

ALTER TABLE public.issue_status_history ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.issue_status_history ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==============================================================================
-- 9. AI_ANALYSIS (Explainable Spam, Category, Severity & Scoring Storage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  spam_score INTEGER NOT NULL DEFAULT 0,
  detected_category TEXT,
  category_confidence NUMERIC,
  detected_language TEXT DEFAULT 'English',
  severity TEXT DEFAULT 'Medium',
  priority TEXT DEFAULT 'medium',
  priority_score INTEGER DEFAULT 50,
  department_name TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_analysis ADD COLUMN IF NOT EXISTS raw_json JSONB;

-- ==============================================================================
-- 10. EVIDENCE (Field Photos & Proof Linked to Storage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('initial_report', 'before', 'after', 'resolution_doc')) DEFAULT 'initial_report',
  file_url TEXT NOT NULL,
  file_name TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- ==============================================================================
-- 11. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_issues_district ON public.issues(district);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_public_id ON public.issues(public_id);
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_officer_id ON public.issues(assigned_officer_id);

CREATE INDEX IF NOT EXISTS idx_reports_issue_id ON public.issue_reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.issue_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_is_duplicate ON public.issue_reports(is_duplicate);

CREATE INDEX IF NOT EXISTS idx_assignments_issue_id ON public.issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_assignments_officer_id ON public.issue_assignments(officer_id);

CREATE INDEX IF NOT EXISTS idx_status_history_issue_id ON public.issue_status_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON public.issue_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_issue_id ON public.ai_analysis(issue_id);
CREATE INDEX IF NOT EXISTS idx_evidence_issue_id ON public.evidence(issue_id);

-- ==============================================================================
-- 12. TRIGGERS: Automatic Recalculation of Report Count, Duplicate Count & Priority
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_issue_reports_and_priority()
RETURNS TRIGGER AS $$
DECLARE
  v_target_issue_id UUID;
  v_report_count INT;
  v_duplicate_count INT;
  v_new_priority_score INT;
  v_new_priority TEXT;
  v_current_score INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_issue_id := OLD.issue_id;
  ELSE
    v_target_issue_id := NEW.issue_id;
  END IF;

  -- Count total citizen reports and duplicates
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_duplicate = true)
  INTO v_report_count, v_duplicate_count
  FROM public.issue_reports
  WHERE issue_id = v_target_issue_id;

  -- Fetch current base priority score
  SELECT priority_score INTO v_current_score
  FROM public.issues
  WHERE id = v_target_issue_id;

  -- Dynamic priority escalation: +6 per duplicate citizen grievance volume
  v_new_priority_score := LEAST(100, GREATEST(COALESCE(v_current_score, 50), 30 + (v_report_count * 6) + (v_duplicate_count * 4)));

  -- Thresholds: >= 85 Critical, >= 70 High, >= 45 Medium, < 45 Low
  IF v_new_priority_score >= 85 THEN
    v_new_priority := 'critical';
  ELSIF v_new_priority_score >= 70 THEN
    v_new_priority := 'high';
  ELSIF v_new_priority_score >= 45 THEN
    v_new_priority := 'medium';
  ELSE
    v_new_priority := 'low';
  END IF;

  -- Update issues master record
  UPDATE public.issues
  SET
    report_count = GREATEST(1, v_report_count),
    duplicate_count = v_duplicate_count,
    priority_score = v_new_priority_score,
    priority = v_new_priority,
    updated_at = NOW()
  WHERE id = v_target_issue_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_recalculate_issue_reports ON public.issue_reports;
CREATE TRIGGER trigger_recalculate_issue_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_issue_reports_and_priority();

-- ==============================================================================
-- 13. SECURE RPCS
-- ==============================================================================

-- Helper: Generate unique Jharkhand Public Issue ID
CREATE OR REPLACE FUNCTION public.generate_jharkhand_public_id(p_district TEXT)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_dist_clean TEXT;
  v_rand INT;
BEGIN
  v_dist_clean := LOWER(COALESCE(p_district, 'ranchi'));
  IF v_dist_clean LIKE '%ranchi%' THEN v_code := 'RNC';
  ELSIF v_dist_clean LIKE '%jamshedpur%' THEN v_code := 'JAM';
  ELSIF v_dist_clean LIKE '%dhanbad%' THEN v_code := 'DHB';
  ELSIF v_dist_clean LIKE '%bokaro%' THEN v_code := 'BKR';
  ELSIF v_dist_clean LIKE '%deoghar%' THEN v_code := 'DGR';
  ELSIF v_dist_clean LIKE '%hazaribagh%' THEN v_code := 'HZB';
  ELSE v_code := 'JHK';
  END IF;

  v_rand := FLOOR(10000 + (RANDOM() * 90000))::INT;
  RETURN 'JH-' || v_code || '-2026-' || LPAD(v_rand::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RPC 1: create_issue_with_report
-- Atomically creates: Master Issue + First Citizen Report + Timeline Milestones + AI Analysis + Evidence
CREATE OR REPLACE FUNCTION public.create_issue_with_report(
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_district TEXT,
  p_location_text TEXT,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_urgency TEXT DEFAULT 'Normal',
  p_is_spam BOOLEAN DEFAULT false,
  p_spam_score INT DEFAULT 0,
  p_detected_category TEXT DEFAULT NULL,
  p_category_confidence NUMERIC DEFAULT 90,
  p_priority TEXT DEFAULT 'medium',
  p_priority_score INT DEFAULT 50,
  p_severity TEXT DEFAULT 'Medium',
  p_department_code TEXT DEFAULT 'OTHER',
  p_evidence_url TEXT DEFAULT NULL,
  p_raw_ai_json JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_public_id TEXT;
  v_dept_id UUID;
  v_dept_name TEXT;
  v_issue_id UUID;
  v_status TEXT;
  v_issue_row RECORD;
BEGIN
  v_user_id := auth.uid();
  v_public_id := public.generate_jharkhand_public_id(p_district);

  -- Resolve Department UUID
  SELECT id, name INTO v_dept_id, v_dept_name
  FROM public.departments
  WHERE code = UPPER(p_department_code);

  IF v_dept_id IS NULL THEN
    SELECT id, name INTO v_dept_id, v_dept_name
    FROM public.departments
    WHERE code = 'OTHER';
  END IF;

  -- If spam detected, set rejected and log review milestone
  IF p_is_spam THEN
    v_status := 'rejected';
  ELSE
    v_status := 'reported';
  END IF;

  -- 1. Insert Master Issue
  INSERT INTO public.issues (
    public_id,
    title,
    description,
    category,
    district,
    location_text,
    latitude,
    longitude,
    status,
    priority,
    priority_score,
    severity,
    department_id,
    created_by,
    report_count,
    duplicate_count
  ) VALUES (
    v_public_id,
    p_title,
    p_description,
    p_category,
    COALESCE(p_district, 'Ranchi'),
    p_location_text,
    p_latitude,
    p_longitude,
    v_status,
    LOWER(COALESCE(p_priority, 'medium')),
    COALESCE(p_priority_score, 50),
    COALESCE(p_severity, 'Medium'),
    v_dept_id,
    v_user_id,
    1,
    0
  ) RETURNING id INTO v_issue_id;

  -- 2. Insert First Issue Report (Original Complaint)
  INSERT INTO public.issue_reports (
    issue_id,
    reporter_user_id,
    description,
    location_text,
    latitude,
    longitude,
    urgency,
    is_duplicate,
    similarity_score
  ) VALUES (
    v_issue_id,
    v_user_id,
    p_description,
    p_location_text,
    p_latitude,
    p_longitude,
    COALESCE(p_urgency, 'Normal'),
    false,
    0
  );

  -- 3. Insert Initial Timeline Milestones
  INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
  VALUES (
    v_issue_id,
    v_status,
    'Citizen',
    'Complaint submitted',
    'Citizen lodged grievance on ground at ' || p_location_text || '.'
  );

  IF NOT p_is_spam THEN
    INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
    VALUES (
      v_issue_id,
      'ai_verified',
      'AI/System',
      'AI verified',
      'Spam check passed (' || p_spam_score || '/100). Category classified: ' || p_category || '. Priority: ' || UPPER(p_priority) || ' (' || p_priority_score || '/100).'
    );

    IF v_dept_name IS NOT NULL THEN
      INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
      VALUES (
        v_issue_id,
        'routed',
        'Department',
        'Department routed',
        'Automatically routed to ' || v_dept_name || ' based on AI domain analysis.'
      );
    END IF;
  ELSE
    INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
    VALUES (
      v_issue_id,
      'rejected',
      'AI/System',
      'Flagged for Review',
      'High spam probability detected (' || p_spam_score || '/100). Flagged for supervisor review.'
    );
  END IF;

  -- 4. Insert AI Analysis Record
  INSERT INTO public.ai_analysis (
    issue_id,
    is_spam,
    spam_score,
    detected_category,
    category_confidence,
    detected_language,
    severity,
    priority,
    priority_score,
    department_name,
    department_id,
    raw_json
  ) VALUES (
    v_issue_id,
    p_is_spam,
    p_spam_score,
    COALESCE(p_detected_category, p_category),
    p_category_confidence,
    'English',
    p_severity,
    p_priority,
    p_priority_score,
    v_dept_name,
    v_dept_id,
    p_raw_ai_json
  );

  -- 5. Attach initial evidence if provided
  IF p_evidence_url IS NOT NULL AND TRIM(p_evidence_url) <> '' THEN
    INSERT INTO public.evidence (
      issue_id,
      uploader_id,
      evidence_type,
      file_url,
      file_name
    ) VALUES (
      v_issue_id,
      v_user_id,
      'initial_report',
      p_evidence_url,
      'initial_citizen_evidence'
    );
  END IF;

  SELECT * INTO v_issue_row FROM public.issues WHERE id = v_issue_id;
  RETURN to_jsonb(v_issue_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 2: support_existing_issue
-- Adds a citizen report to an existing issue, triggering automatic deduplication counters
CREATE OR REPLACE FUNCTION public.support_existing_issue(
  p_issue_id UUID,
  p_description TEXT,
  p_location_text TEXT DEFAULT NULL,
  p_similarity_score NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_existing RECORD;
  v_report_id UUID;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_existing FROM public.issues WHERE id = p_issue_id;
  IF v_existing IS NULL THEN
    RAISE EXCEPTION 'Civic issue not found: %', p_issue_id;
  END IF;

  -- Prevent duplicate support by the same authenticated citizen session
  IF v_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.issue_reports
    WHERE issue_id = p_issue_id AND reporter_user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You have already submitted or supported a report for this issue.';
  END IF;

  -- Insert citizen report marked as duplicate
  INSERT INTO public.issue_reports (
    issue_id,
    reporter_user_id,
    description,
    location_text,
    urgency,
    is_duplicate,
    similarity_score
  ) VALUES (
    p_issue_id,
    v_user_id,
    p_description,
    COALESCE(p_location_text, v_existing.location_text),
    'Normal',
    true,
    COALESCE(p_similarity_score, 0)
  ) RETURNING id INTO v_report_id;

  -- Insert milestone to timeline
  INSERT INTO public.issue_status_history (
    issue_id,
    status,
    actor,
    action,
    notes
  ) VALUES (
    p_issue_id,
    v_existing.status,
    'Citizen',
    'Citizen Support Added',
    'Another resident citizen confirmed this grievance on ground. Semantic similarity: ' || ROUND(COALESCE(p_similarity_score, 0))::TEXT || '%.'
  );

  SELECT * INTO v_existing FROM public.issues WHERE id = p_issue_id;
  RETURN to_jsonb(v_existing);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 3: assign_issue_officer
-- Admin assigns a field officer to an issue
CREATE OR REPLACE FUNCTION public.assign_issue_officer(
  p_issue_id UUID,
  p_officer_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_officer RECORD;
  v_issue RECORD;
  v_caller_role TEXT;
BEGIN
  -- Verify permission: Only admin (or during demo switch) can assign officers
  v_caller_role := public.current_user_role();
  IF auth.uid() IS NOT NULL AND v_caller_role NOT IN ('admin', 'officer') THEN
    -- If user has profile but role is citizen, enforce restriction
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'citizen') THEN
      RAISE EXCEPTION 'Permission denied: Only administrators and supervisors can assign field officers.';
    END IF;
  END IF;

  SELECT * INTO v_officer FROM public.officers WHERE id = p_officer_id;
  IF v_officer IS NULL THEN
    RAISE EXCEPTION 'Officer not found: %', p_officer_id;
  END IF;

  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  IF v_issue IS NULL THEN
    RAISE EXCEPTION 'Issue not found: %', p_issue_id;
  END IF;

  -- 1. Create or update issue_assignments
  INSERT INTO public.issue_assignments (
    issue_id,
    officer_id,
    assigned_by,
    status,
    notes,
    assigned_at
  ) VALUES (
    p_issue_id,
    p_officer_id,
    auth.uid(),
    'assigned',
    p_notes,
    NOW()
  );

  -- 2. Update issue master record
  UPDATE public.issues
  SET
    assigned_officer_id = p_officer_id,
    status = 'officer_assigned',
    updated_at = NOW()
  WHERE id = p_issue_id;

  -- 3. Add timeline entry
  INSERT INTO public.issue_status_history (
    issue_id,
    status,
    actor,
    action,
    notes
  ) VALUES (
    p_issue_id,
    'officer_assigned',
    'Department',
    'Officer assigned',
    'Assigned to field officer ' || v_officer.name || ' (Badge: ' || COALESCE(v_officer.badge_number, 'JH-OFFICER') || '). Dispatched for site inspection.'
  );

  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  RETURN to_jsonb(v_issue);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 4: officer_update_issue_status
-- Officer progresses task lifecycle: accepted -> work_started -> resolved_awaiting_verification
CREATE OR REPLACE FUNCTION public.officer_update_issue_status(
  p_issue_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_issue RECORD;
  v_action TEXT;
BEGIN
  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  IF v_issue IS NULL THEN
    RAISE EXCEPTION 'Issue not found: %', p_issue_id;
  END IF;

  -- Enforce valid lifecycle transitions
  IF p_new_status = 'accepted' THEN
    v_action := 'Officer accepted';
    UPDATE public.issue_assignments
    SET status = 'accepted', accepted_at = NOW()
    WHERE issue_id = p_issue_id AND status = 'assigned';
  ELSIF p_new_status = 'work_started' THEN
    v_action := 'Work started';
    UPDATE public.issue_assignments
    SET status = 'in_progress'
    WHERE issue_id = p_issue_id;
  ELSIF p_new_status = 'resolved_awaiting_verification' THEN
    v_action := 'Work completed, awaiting verification';
    UPDATE public.issue_assignments
    SET status = 'completed', completed_at = NOW()
    WHERE issue_id = p_issue_id;
  ELSIF p_new_status = 'resolved' THEN
    RAISE EXCEPTION 'Officers cannot directly mark an issue as Resolved. Citizen ground verification is mandatory.';
  ELSE
    v_action := 'Status updated to ' || p_new_status;
  END IF;

  -- Update issue master record
  UPDATE public.issues
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_issue_id;

  -- Add timeline entry
  INSERT INTO public.issue_status_history (
    issue_id,
    status,
    actor,
    action,
    notes
  ) VALUES (
    p_issue_id,
    p_new_status,
    'Field Officer',
    v_action,
    COALESCE(p_notes, 'Field officer updated remediation progress to ' || p_new_status || '.')
  );

  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  RETURN to_jsonb(v_issue);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 5: verify_issue_resolution
-- Citizen confirms or disputes remediation
CREATE OR REPLACE FUNCTION public.verify_issue_resolution(
  p_issue_id UUID,
  p_confirmed BOOLEAN,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_issue RECORD;
  v_next_status TEXT;
  v_action TEXT;
  v_notes TEXT;
BEGIN
  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  IF v_issue IS NULL THEN
    RAISE EXCEPTION 'Issue not found: %', p_issue_id;
  END IF;

  IF v_issue.status <> 'resolved_awaiting_verification' THEN
    RAISE EXCEPTION 'Verification is only permitted when issue is in resolved_awaiting_verification status (current: %)', v_issue.status;
  END IF;

  IF p_confirmed THEN
    v_next_status := 'resolved';
    v_action := 'Citizen verified resolution';
    v_notes := COALESCE(p_comment, 'Resident citizen verified the site inspection and confirmed satisfactory repair on ground. Grievance officially resolved.');

    UPDATE public.issues
    SET
      status = v_next_status,
      citizen_verification = true,
      resolved_at = NOW(),
      updated_at = NOW()
    WHERE id = p_issue_id;
  ELSE
    v_next_status := 'escalated';
    v_action := 'Citizen disputed resolution';
    v_notes := COALESCE(p_comment, 'Resident citizen inspected site and reported that ground issue is still unresolved. Grievance escalated to Department Superintending Engineer.');

    UPDATE public.issues
    SET
      status = v_next_status,
      citizen_verification = false,
      updated_at = NOW()
    WHERE id = p_issue_id;
  END IF;

  -- Add timeline entry
  INSERT INTO public.issue_status_history (
    issue_id,
    status,
    actor,
    action,
    notes
  ) VALUES (
    p_issue_id,
    v_next_status,
    'Citizen',
    v_action,
    v_notes
  );

  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  RETURN to_jsonb(v_issue);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 6: recalculate_issue_metrics
-- Recompute report count, duplicate count, and priority score on demand
CREATE OR REPLACE FUNCTION public.recalculate_issue_metrics(p_issue_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_report_count INT;
  v_duplicate_count INT;
  v_new_priority_score INT;
  v_new_priority TEXT;
  v_current_score INT;
  v_issue RECORD;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_duplicate = true)
  INTO v_report_count, v_duplicate_count
  FROM public.issue_reports
  WHERE issue_id = p_issue_id;

  SELECT priority_score INTO v_current_score
  FROM public.issues
  WHERE id = p_issue_id;

  v_new_priority_score := LEAST(100, GREATEST(COALESCE(v_current_score, 50), 30 + (v_report_count * 6) + (v_duplicate_count * 4)));

  IF v_new_priority_score >= 85 THEN
    v_new_priority := 'critical';
  ELSIF v_new_priority_score >= 70 THEN
    v_new_priority := 'high';
  ELSIF v_new_priority_score >= 45 THEN
    v_new_priority := 'medium';
  ELSE
    v_new_priority := 'low';
  END IF;

  UPDATE public.issues
  SET
    report_count = GREATEST(1, v_report_count),
    duplicate_count = v_duplicate_count,
    priority_score = v_new_priority_score,
    priority = v_new_priority,
    updated_at = NOW()
  WHERE id = p_issue_id;

  SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id;
  RETURN to_jsonb(v_issue);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Departments
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
CREATE POLICY "Admins manage departments" ON public.departments
  FOR ALL USING (public.is_admin());

-- 3. Officers
DROP POLICY IF EXISTS "Public read officers" ON public.officers;
CREATE POLICY "Public read officers" ON public.officers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage officers" ON public.officers;
CREATE POLICY "Admins manage officers" ON public.officers
  FOR ALL USING (public.is_admin());

-- 4. Issues: Public read for civic transparency; mutations through secure RPCs or authorized roles
DROP POLICY IF EXISTS "Public read issues" ON public.issues;
CREATE POLICY "Public read issues" ON public.issues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Citizens insert issues" ON public.issues;
CREATE POLICY "Citizens insert issues" ON public.issues
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR true);

DROP POLICY IF EXISTS "Authorized update issues" ON public.issues;
CREATE POLICY "Authorized update issues" ON public.issues
  FOR UPDATE USING (
    public.is_officer()
    OR assigned_officer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
  );

-- 5. Issue Reports: Public read for consolidated counts; insert by citizen
DROP POLICY IF EXISTS "Public read issue reports" ON public.issue_reports;
CREATE POLICY "Public read issue reports" ON public.issue_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Citizens insert issue reports" ON public.issue_reports;
CREATE POLICY "Citizens insert issue reports" ON public.issue_reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    OR reporter_user_id IS NULL
    OR reporter_user_id = auth.uid()
  );

-- 6. Issue Assignments: Public read; manage by admin/officer
DROP POLICY IF EXISTS "Public read issue assignments" ON public.issue_assignments;
CREATE POLICY "Public read issue assignments" ON public.issue_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage issue assignments" ON public.issue_assignments;
CREATE POLICY "Manage issue assignments" ON public.issue_assignments
  FOR ALL USING (public.is_officer());

-- 7. Issue Status History: Immutable public audit log
DROP POLICY IF EXISTS "Public read status history" ON public.issue_status_history;
CREATE POLICY "Public read status history" ON public.issue_status_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert status history" ON public.issue_status_history;
CREATE POLICY "Insert status history" ON public.issue_status_history
  FOR INSERT WITH CHECK (true);

-- 8. AI Analysis: Public read for explainability
DROP POLICY IF EXISTS "Public read ai analysis" ON public.ai_analysis;
CREATE POLICY "Public read ai analysis" ON public.ai_analysis
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert ai analysis" ON public.ai_analysis;
CREATE POLICY "Insert ai analysis" ON public.ai_analysis
  FOR INSERT WITH CHECK (true);

-- 9. Evidence: Public read; authenticated/anon upload
DROP POLICY IF EXISTS "Public read evidence" ON public.evidence;
CREATE POLICY "Public read evidence" ON public.evidence
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert evidence" ON public.evidence;
CREATE POLICY "Insert evidence" ON public.evidence
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR true);

-- ==============================================================================
-- 15. STORAGE POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-evidence',
  'issue-evidence',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Public read issue evidence" ON storage.objects;
CREATE POLICY "Public read issue evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-evidence');

DROP POLICY IF EXISTS "Allow upload to issue-evidence" ON storage.objects;
CREATE POLICY "Allow upload to issue-evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'issue-evidence');

DROP POLICY IF EXISTS "Allow update to issue-evidence" ON storage.objects;
CREATE POLICY "Allow update to issue-evidence" ON storage.objects
  FOR UPDATE USING (bucket_id = 'issue-evidence');

-- ==============================================================================
-- 16. SEED DATA (IF EMPTY)
-- ==============================================================================
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
  description = EXCLUDED.description,
  head = EXCLUDED.head;

-- Seed Field Officers
DO $$
DECLARE
  v_roads_id UUID;
  v_water_id UUID;
  v_power_id UUID;
  v_sanitation_id UUID;
  v_drainage_id UUID;
BEGIN
  SELECT id INTO v_roads_id FROM public.departments WHERE code = 'ROADS';
  SELECT id INTO v_water_id FROM public.departments WHERE code = 'WATER';
  SELECT id INTO v_power_id FROM public.departments WHERE code = 'POWER';
  SELECT id INTO v_sanitation_id FROM public.departments WHERE code = 'SANITATION';
  SELECT id INTO v_drainage_id FROM public.departments WHERE code = 'DRAINAGE';

  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-PWD-0482') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_roads_id, 'Ramesh Kumar Verma', '+91 94311 20491', 'Ranchi', 'JH-PWD-0482', 'Assistant Engineer (Roads)');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-DWSD-1102') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_water_id, 'Sunita Soren', '+91 94313 88102', 'Dhanbad', 'JH-DWSD-1102', 'Junior Engineer (Water Works)');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-JBVNL-0914') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_power_id, 'Amitesh Singh', '+91 94317 40193', 'Bokaro', 'JH-JBVNL-0914', 'Sub-Divisional Officer (Electric)');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-SBM-0238') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_sanitation_id, 'Priya Murmu', '+91 94319 77215', 'Jamshedpur', 'JH-SBM-0238', 'Sanitary Inspector');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-DRN-0761') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_drainage_id, 'Rajesh Mahato', '+91 94315 31980', 'Deoghar', 'JH-DRN-0761', 'Junior Engineer (Drainage)');
  END IF;
END $$;

-- Seed Demo Benchmark Issues (if table is completely empty)
DO $$
DECLARE
  v_roads_id UUID;
  v_water_id UUID;
  v_power_id UUID;
  v_sanitation_id UUID;
  v_off_verma UUID;
  v_off_soren UUID;
  v_off_singh UUID;
  v_off_murmu UUID;
  v_iss1 UUID;
  v_iss2 UUID;
  v_iss3 UUID;
  v_iss4 UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.issues LIMIT 1) THEN
    SELECT id INTO v_roads_id FROM public.departments WHERE code = 'ROADS';
    SELECT id INTO v_water_id FROM public.departments WHERE code = 'WATER';
    SELECT id INTO v_power_id FROM public.departments WHERE code = 'POWER';
    SELECT id INTO v_sanitation_id FROM public.departments WHERE code = 'SANITATION';

    SELECT id INTO v_off_verma FROM public.officers WHERE badge_number = 'JH-PWD-0482';
    SELECT id INTO v_off_soren FROM public.officers WHERE badge_number = 'JH-DWSD-1102';
    SELECT id INTO v_off_singh FROM public.officers WHERE badge_number = 'JH-JBVNL-0914';
    SELECT id INTO v_off_murmu FROM public.officers WHERE badge_number = 'JH-SBM-0238';

    -- Issue 1: Ranchi DAV School Road Pothole (Critical, Officer Assigned)
    INSERT INTO public.issues (
      public_id, title, description, category, district, location_text,
      latitude, longitude, status, priority, priority_score, severity,
      department_id, assigned_officer_id, report_count, duplicate_count
    ) VALUES (
      'JH-RNC-2026-08142',
      'Severe Crater Pothole outside DAV Public School Bariatu',
      'Deep 3.5ft crater pothole directly outside primary school gate. Water accumulates creating deep sinkhole hazard during morning school rush.',
      'Road Infrastructure', 'Ranchi', 'Outside Gate 2, DAV Public School, Bariatu Road, Ranchi',
      23.3872, 85.3418, 'officer_assigned', 'critical', 94, 'Critical',
      v_roads_id, v_off_verma, 4, 3
    ) RETURNING id INTO v_iss1;

    INSERT INTO public.issue_reports (issue_id, description, location_text, urgency, is_duplicate, similarity_score)
    VALUES
      (v_iss1, 'Deep crater pothole outside DAV School. Two two-wheelers skidded this morning.', 'Gate 2, DAV School Bariatu', 'Emergency', false, 0),
      (v_iss1, 'Bariatu road dav school ke samne bada khadda hai accident ho sakta hai.', 'DAV School, Bariatu', 'Urgent', true, 92),
      (v_iss1, 'Large pothole filled with rainwater near school entrance.', 'Bariatu Road Ranchi', 'Urgent', true, 88),
      (v_iss1, 'Hazardous road condition outside school.', 'Near DAV Bariatu Gate', 'Normal', true, 84);

    INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
    VALUES
      (v_iss1, 'reported', 'Citizen', 'Complaint submitted', 'Citizen filed ground report at Bariatu Road, Ranchi.'),
      (v_iss1, 'ai_verified', 'AI/System', 'AI verified', 'Passed spam filter (0/100). Priority: CRITICAL (94/100). Detected near primary educational institution.'),
      (v_iss1, 'routed', 'Department', 'Department routed', 'Auto-routed to Road Infrastructure Department.'),
      (v_iss1, 'officer_assigned', 'Department', 'Officer assigned', 'Dispatched to Assistant Engineer Ramesh Kumar Verma.');

    -- Issue 2: Dhanbad Water Pipeline Burst (Resolved - Awaiting Verification)
    INSERT INTO public.issues (
      public_id, title, description, category, district, location_text,
      latitude, longitude, status, priority, priority_score, severity,
      department_id, assigned_officer_id, report_count, duplicate_count
    ) VALUES (
      'JH-DHB-2026-04291',
      'Drinking Water Supply Main Pipeline Rupture at Bank More',
      'High-pressure main municipal water line burst flooding the road and cutting drinking supply to 400 households.',
      'Water Supply', 'Dhanbad', 'Bank More Junction, Dhanbad',
      23.7957, 86.4304, 'resolved_awaiting_verification', 'high', 82, 'High',
      v_water_id, v_off_soren, 3, 2
    ) RETURNING id INTO v_iss2;

    INSERT INTO public.issue_reports (issue_id, description, location_text, urgency, is_duplicate, similarity_score)
    VALUES
      (v_iss2, 'Drinking water pipe burst near Bank More junction.', 'Bank More Dhanbad', 'Urgent', false, 0),
      (v_iss2, 'Water flooding market street from broken pipe.', 'Near Bank More Chowk', 'Normal', true, 89),
      (v_iss2, 'No water supply in Ward 12 due to pipe burst.', 'Bank More area', 'Normal', true, 85);

    INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
    VALUES
      (v_iss2, 'reported', 'Citizen', 'Complaint submitted', 'Citizen lodged water grievance.'),
      (v_iss2, 'officer_assigned', 'Department', 'Officer assigned', 'Dispatched to Junior Engineer Sunita Soren.'),
      (v_iss2, 'accepted', 'Field Officer', 'Officer accepted', 'Officer Soren accepted repair task.'),
      (v_iss2, 'work_started', 'Field Officer', 'Work started', 'Maintenance squad reached location and isolated valve.'),
      (v_iss2, 'resolved_awaiting_verification', 'Field Officer', 'Work completed, awaiting verification', 'Pipeline welded and water pressure restored. Uploaded inspection photos. Awaiting citizen confirmation.');

    -- Issue 3: Bokaro Transformer Sparking (Reported)
    INSERT INTO public.issues (
      public_id, title, description, category, district, location_text,
      latitude, longitude, status, priority, priority_score, severity,
      department_id, assigned_officer_id, report_count, duplicate_count
    ) VALUES (
      'JH-BKR-2026-06103',
      'Dangerous High Voltage Wire Hanging Low Near Transformer',
      '11kV line sagging dangerously low near children playground in Sector 4.',
      'Electricity', 'Bokaro', 'Sector 4-F, Bokaro Steel City',
      23.6693, 86.1511, 'reported', 'high', 78, 'High',
      v_power_id, v_off_singh, 1, 0
    ) RETURNING id INTO v_iss3;

    INSERT INTO public.issue_reports (issue_id, description, location_text, urgency, is_duplicate, similarity_score)
    VALUES
      (v_iss3, 'High voltage wire hanging low near Sector 4 children playground.', 'Sector 4-F Bokaro', 'Urgent', false, 0);

    INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
    VALUES
      (v_iss3, 'reported', 'Citizen', 'Complaint submitted', 'Lodged by resident citizen.');

    -- Issue 4: Jamshedpur Sakchi Market Overflow (Resolved)
    INSERT INTO public.issues (
      public_id, title, description, category, district, location_text,
      latitude, longitude, status, priority, priority_score, severity,
      department_id, assigned_officer_id, report_count, duplicate_count,
      citizen_verification, resolved_at
    ) VALUES (
      'JH-JAM-2026-09214',
      'Solid Waste Overflow at Sakchi Market Secondary Bin',
      'Commercial market waste accumulation cleared by municipal compactor trucks.',
      'Sanitation', 'Jamshedpur', 'Sakchi Main Market, Jamshedpur',
      22.8046, 86.2029, 'resolved', 'medium', 52, 'Medium',
      v_sanitation_id, v_off_murmu, 2, 1,
      true, NOW() - INTERVAL '2 hours'
    ) RETURNING id INTO v_iss4;

    INSERT INTO public.issue_reports (issue_id, description, location_text, urgency, is_duplicate, similarity_score)
    VALUES
      (v_iss4, 'Commercial market waste bin overflowing.', 'Sakchi Market Jamshedpur', 'Normal', false, 0),
      (v_iss4, 'Garbage dumping on road near Sakchi fruit stalls.', 'Sakchi Market', 'Normal', true, 91);

    INSERT INTO public.issue_status_history (issue_id, status, actor, action, notes)
    VALUES
      (v_iss4, 'reported', 'Citizen', 'Complaint submitted', 'Grievance lodged.'),
      (v_iss4, 'officer_assigned', 'Department', 'Officer assigned', 'Dispatched to Sanitary Inspector Priya Murmu.'),
      (v_iss4, 'resolved_awaiting_verification', 'Field Officer', 'Work completed, awaiting verification', 'Bin cleared and disinfected.'),
      (v_iss4, 'resolved', 'Citizen', 'Citizen verified resolution', 'Local shopkeeper confirmed site cleared.');

  END IF;
END $$;

-- ==============================================================================
-- 17. REALTIME SETUP
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'issues'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'issue_status_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_status_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'issue_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_assignments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'evidence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
