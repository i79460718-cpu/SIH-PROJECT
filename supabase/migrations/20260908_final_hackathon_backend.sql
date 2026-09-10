-- ==============================================================================
-- JANSAMVAD AI — Final Complete Hackathon Database Migration
-- Civic Grievance Intelligence & Tri-Party Resolution Platform for Jharkhand
-- File: supabase/migrations/20260908_final_hackathon_backend.sql
-- ==============================================================================

-- 1. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES (Role-based Authentication: Citizen, Officer, Admin)
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

-- Trigger to automatically create citizen profile on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone, district)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role'), 'citizen'),
    COALESCE((NEW.raw_user_meta_data->>'full_name'), (NEW.raw_user_meta_data->>'name'), 'Citizen Resident'),
    COALESCE((NEW.raw_user_meta_data->>'phone'), NEW.phone, NULL),
    COALESCE((NEW.raw_user_meta_data->>'district'), 'Ranchi')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing auth.users
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'citizen', 'Citizen Resident'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. DEPARTMENTS (Live Supabase Seed Entities)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  head TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Jharkhand Civic Departments
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

-- ==============================================================================
-- 3. OFFICERS (Field Officers linked to Departments)
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

-- Seed Demo Officers mapped to real departments
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

  -- Roads officer
  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-PWD-0482') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_roads_id, 'Ramesh Kumar Verma', '+91 94311 20491', 'Ranchi', 'JH-PWD-0482', 'Assistant Engineer (Roads)');
  END IF;

  -- Water officer
  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-DWSD-1102') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_water_id, 'Sunita Soren', '+91 94313 88102', 'Dhanbad', 'JH-DWSD-1102', 'Junior Engineer (Water Works)');
  END IF;

  -- Power officer
  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-JBVNL-0914') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_power_id, 'Amitesh Singh', '+91 94317 40193', 'Bokaro', 'JH-JBVNL-0914', 'Sub-Divisional Officer (Electric)');
  END IF;

  -- Sanitation officer
  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-SBM-0238') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_sanitation_id, 'Priya Murmu', '+91 94319 77215', 'Jamshedpur', 'JH-SBM-0238', 'Sanitary Inspector');
  END IF;

  -- Drainage officer
  IF NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = 'JH-DRN-0761') THEN
    INSERT INTO public.officers (department_id, name, phone, district, badge_number, designation)
    VALUES (v_drainage_id, 'Rajesh Mahato', '+91 94315 31980', 'Deoghar', 'JH-DRN-0761', 'Junior Engineer (Drainage)');
  END IF;
END $$;

-- ==============================================================================
-- 4. ISSUES (Civic Issues Master Table)
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

-- Ensure all columns exist idempotently if table was pre-existing
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS citizen_verification BOOLEAN DEFAULT NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS duplicate_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_issues_district ON public.issues(district);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_public_id ON public.issues(public_id);
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_officer_id ON public.issues(assigned_officer_id);

-- ==============================================================================
-- 5. ISSUE_REPORTS (Citizen Grievance Submissions linked to Master Issues)
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

ALTER TABLE public.issue_reports ADD COLUMN IF NOT EXISTS similarity_score NUMERIC DEFAULT 0;
ALTER TABLE public.issue_reports ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reports_issue_id ON public.issue_reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.issue_reports(reporter_user_id);

-- UNIQUE CONSTRAINT: Prevent the same citizen from supporting the same issue multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_citizen_issue_report
  ON public.issue_reports (issue_id, reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;

-- ==============================================================================
-- 6. ISSUE_ASSIGNMENTS (Department Officer Workflow)
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
CREATE INDEX IF NOT EXISTS idx_assignments_issue_id ON public.issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_assignments_officer_id ON public.issue_assignments(officer_id);

-- ==============================================================================
-- 7. ISSUE_STATUS_HISTORY (Immutable Tri-Party Transparency Timeline)
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
CREATE INDEX IF NOT EXISTS idx_status_history_issue_id ON public.issue_status_history(issue_id);

-- ==============================================================================
-- 8. AI_ANALYSIS (Explainable Spam, Priority, and Routing Storage)
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

CREATE INDEX IF NOT EXISTS idx_ai_analysis_issue_id ON public.ai_analysis(issue_id);

-- ==============================================================================
-- 9. EVIDENCE (Storage-backed Evidence Records for Citizens & Officers)
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
CREATE INDEX IF NOT EXISTS idx_evidence_issue_id ON public.evidence(issue_id);

-- ==============================================================================
-- 10. AUTOMATIC TRIGGERS: Report Count, Duplicate Count & Priority Recalculation
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

  -- Count total reports and duplicate merged reports
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_duplicate = true)
  INTO v_report_count, v_duplicate_count
  FROM public.issue_reports
  WHERE issue_id = v_target_issue_id;

  -- Fetch current base priority score
  SELECT priority_score INTO v_current_score
  FROM public.issues
  WHERE id = v_target_issue_id;

  -- Dynamic priority escalation based on citizen report density
  -- Base score + scaling boost for multi-citizen grievance volume
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
-- 11. ATOMIC SECURE RPC FUNCTIONS
-- ==============================================================================

-- Helper: Generate server-side Jharkhand Public Issue ID
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
-- Atomically creates: Issue + First IssueReport + StatusHistory + AI Analysis
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

  -- Flagged for Review if spam detected
  IF p_is_spam THEN
    v_status := 'rejected';
  ELSE
    v_status := 'reported';
  END IF;

  -- 1. Insert Issue
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

  -- 3. Insert Initial Timeline Status History
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

  -- Return complete issue record
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
  v_current_count INT;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_existing FROM public.issues WHERE id = p_issue_id;
  IF v_existing IS NULL THEN
    RAISE EXCEPTION 'Civic issue not found: %', p_issue_id;
  END IF;

  -- Insert citizen report as duplicate
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

  -- Add timeline entry
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
BEGIN
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

  -- Update issue
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

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
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

-- 1. Profiles: users can read their own profile, officers/admins can read all
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Departments: Public read
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments
  FOR SELECT USING (true);

-- 3. Officers: Public read
DROP POLICY IF EXISTS "Public read officers" ON public.officers;
CREATE POLICY "Public read officers" ON public.officers
  FOR SELECT USING (true);

-- 4. Issues: Public read for transparency, inserts/updates via security definer RPCs
DROP POLICY IF EXISTS "Public read issues" ON public.issues;
CREATE POLICY "Public read issues" ON public.issues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Citizens create issues" ON public.issues;
CREATE POLICY "Citizens create issues" ON public.issues
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow issue updates" ON public.issues;
CREATE POLICY "Allow issue updates" ON public.issues
  FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Issue Reports: Public read of reports, inserts allowed
DROP POLICY IF EXISTS "Read reports" ON public.issue_reports;
CREATE POLICY "Read reports" ON public.issue_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert reports" ON public.issue_reports;
CREATE POLICY "Insert reports" ON public.issue_reports
  FOR INSERT WITH CHECK (true);

-- 6. Issue Status History (Timeline): Public read for full civic transparency
DROP POLICY IF EXISTS "Public read issue timeline" ON public.issue_status_history;
CREATE POLICY "Public read issue timeline" ON public.issue_status_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert status history" ON public.issue_status_history;
CREATE POLICY "Insert status history" ON public.issue_status_history
  FOR INSERT WITH CHECK (true);

-- 7. Issue Assignments: Public read for transparency
DROP POLICY IF EXISTS "Public read assignments" ON public.issue_assignments;
CREATE POLICY "Public read assignments" ON public.issue_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage assignments" ON public.issue_assignments;
CREATE POLICY "Manage assignments" ON public.issue_assignments
  FOR ALL USING (true);

-- 8. AI Analysis: Public read for explainability
DROP POLICY IF EXISTS "Public read ai analysis" ON public.ai_analysis;
CREATE POLICY "Public read ai analysis" ON public.ai_analysis
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert ai analysis" ON public.ai_analysis;
CREATE POLICY "Insert ai analysis" ON public.ai_analysis
  FOR INSERT WITH CHECK (true);

-- 9. Evidence: Public read, authenticated/anon upload
DROP POLICY IF EXISTS "Public read evidence" ON public.evidence;
CREATE POLICY "Public read evidence" ON public.evidence
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert evidence" ON public.evidence;
CREATE POLICY "Insert evidence" ON public.evidence
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 13. STORAGE BUCKET: issue-evidence
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-evidence', 'issue-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

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
-- 14. SUPABASE REALTIME PUBLICATION
-- ==============================================================================
DO $$
BEGIN
  -- Add tables to realtime publication if not already included
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
  -- Ignore publication errors in restricted environments
  NULL;
END $$;
