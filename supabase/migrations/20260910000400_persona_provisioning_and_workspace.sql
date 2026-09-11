-- Canonical SIH26043 persona provisioning and workspace extensions.
-- This migration is idempotent and is intended to run after the ecosystem seed.

ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS institution_type TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Jharkhand';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS research_areas TEXT[] DEFAULT '{}';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS innovation_centre TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS incubation_facilities TEXT[] DEFAULT '{}';
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS geographic_scope TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.university_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  disciplines TEXT[] NOT NULL DEFAULT '{}',
  research_areas TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(university_id, name)
);
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.university_departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  expertise TEXT[] NOT NULL DEFAULT '{}', research_areas TEXT[] NOT NULL DEFAULT '{}', skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT DEFAULT 'AVAILABLE', mentor_status BOOLEAN NOT NULL DEFAULT true, active BOOLEAN NOT NULL DEFAULT true,
  data_origin TEXT NOT NULL DEFAULT 'DEMO', verification_status TEXT NOT NULL DEFAULT 'DEMO', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.university_departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL, skills TEXT[] NOT NULL DEFAULT '{}', study_year INTEGER, availability TEXT DEFAULT 'AVAILABLE', active BOOLEAN NOT NULL DEFAULT true,
  data_origin TEXT NOT NULL DEFAULT 'DEMO', verification_status TEXT NOT NULL DEFAULT 'DEMO', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE, title TEXT NOT NULL,
  problem_statement TEXT, proposed_solution TEXT, methodology TEXT, technology TEXT, innovation TEXT, expected_outcome TEXT,
  resources TEXT, budget NUMERIC, industry_requirements TEXT, timeline TEXT, status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','WITHDRAWN','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.challenge_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE, evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'UNDER_REVIEW' CHECK(status IN ('UNDER_REVIEW','ACCEPTED','REJECTED','INFO_REQUESTED')),
  comment TEXT, assigned_faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(issue_id, university_id)
);
CREATE TABLE IF NOT EXISTS public.impact_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, metric_value NUMERIC, unit TEXT, narrative TEXT, recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_origin TEXT NOT NULL DEFAULT 'DEMO', verification_status TEXT NOT NULL DEFAULT 'DEMO', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faculty_university ON public.faculty(university_id);
CREATE INDEX IF NOT EXISTS idx_students_university ON public.students(university_id);
CREATE INDEX IF NOT EXISTS idx_proposals_university ON public.proposals(university_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_university ON public.challenge_evaluations(university_id);

-- Assign the first seeded organization to accounts created with the respective
-- role metadata. The browser also persists this linkage for legacy profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'citizen'); v_uni uuid; v_partner uuid;
BEGIN
  IF v_role NOT IN ('citizen','officer','admin','university_admin','industry_partner') THEN v_role := 'citizen'; END IF;
  IF v_role = 'university_admin' THEN SELECT id INTO v_uni FROM public.universities ORDER BY created_at LIMIT 1; END IF;
  IF v_role = 'industry_partner' THEN SELECT id INTO v_partner FROM public.industry_partners ORDER BY created_at LIMIT 1; END IF;
  INSERT INTO public.profiles (id, role, full_name, university_id, industry_partner_id)
  VALUES (new.id, v_role, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), v_uni, v_partner)
  ON CONFLICT (id) DO UPDATE SET role = excluded.role, university_id = coalesce(public.profiles.university_id, excluded.university_id), industry_partner_id = coalesce(public.profiles.industry_partner_id, excluded.industry_partner_id);
  RETURN new;
END; $$;

CREATE OR REPLACE FUNCTION public.current_app_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION public.owns_university(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_app_role() = 'admin' OR EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND university_id=target)
$$;
CREATE OR REPLACE FUNCTION public.owns_partner(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_app_role() = 'admin' OR EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND industry_partner_id=target)
$$;

ALTER TABLE public.university_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read ecosystem departments" ON public.university_departments FOR SELECT USING (true);
CREATE POLICY "Manage own ecosystem departments" ON public.university_departments FOR ALL USING (public.owns_university(university_id)) WITH CHECK (public.owns_university(university_id));
CREATE POLICY "Read ecosystem faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Manage own ecosystem faculty" ON public.faculty FOR ALL USING (public.owns_university(university_id)) WITH CHECK (public.owns_university(university_id));
CREATE POLICY "Read ecosystem students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Manage own ecosystem students" ON public.students FOR ALL USING (public.owns_university(university_id)) WITH CHECK (public.owns_university(university_id));
CREATE POLICY "Read ecosystem proposals" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Manage own ecosystem proposals" ON public.proposals FOR ALL USING (public.owns_university(university_id)) WITH CHECK (public.owns_university(university_id));
CREATE POLICY "Read ecosystem evaluations" ON public.challenge_evaluations FOR SELECT USING (true);
CREATE POLICY "Manage own ecosystem evaluations" ON public.challenge_evaluations FOR ALL USING (public.owns_university(university_id)) WITH CHECK (public.owns_university(university_id));
CREATE POLICY "Read ecosystem impact" ON public.impact_records FOR SELECT USING (true);
CREATE POLICY "Manage ecosystem impact" ON public.impact_records FOR ALL USING (public.current_app_role() IN ('admin','university_admin')) WITH CHECK (public.current_app_role() IN ('admin','university_admin'));

-- Seed connected university people. They are expressly DEMO identities, not claims
-- of real faculty memberships or institutional partnerships.
DO $$ DECLARE bau uuid; ag uuid; water uuid; cs uuid; f1 uuid; f2 uuid; f3 uuid; f4 uuid; f5 uuid;
BEGIN
 SELECT id INTO bau FROM public.universities WHERE name='Birsa Agricultural University' LIMIT 1;
 IF bau IS NULL THEN RETURN; END IF;
 INSERT INTO public.university_departments(university_id,name,disciplines,research_areas) VALUES
 (bau,'Agronomy & Soil Science',ARRAY['Agriculture'],ARRAY['Soil Health','Precision Agriculture']),
 (bau,'Water Resources Engineering',ARRAY['Water Management'],ARRAY['Irrigation','Water Quality']),
 (bau,'Computing & Rural Innovation',ARRAY['Computer Science'],ARRAY['IoT','Data Science']) ON CONFLICT DO NOTHING;
 SELECT id INTO ag FROM public.university_departments WHERE university_id=bau AND name='Agronomy & Soil Science';
 SELECT id INTO water FROM public.university_departments WHERE university_id=bau AND name='Water Resources Engineering';
 SELECT id INTO cs FROM public.university_departments WHERE university_id=bau AND name='Computing & Rural Innovation';
 INSERT INTO public.faculty(university_id,department_id,name,expertise,research_areas,skills) VALUES
 (bau,ag,'Demo Faculty: A. K. Singh',ARRAY['Soil Health'],ARRAY['Nutrient Mapping'],ARRAY['Field Research']),
 (bau,water,'Demo Faculty: S. Kumari',ARRAY['Irrigation'],ARRAY['Water Quality'],ARRAY['Hydrology']),
 (bau,cs,'Demo Faculty: R. Oraon',ARRAY['IoT','AI'],ARRAY['Rural Informatics'],ARRAY['Prototyping']),
 (bau,ag,'Demo Faculty: M. Tirkey',ARRAY['Post Harvest'],ARRAY['Food Systems'],ARRAY['Community Training']),
 (bau,water,'Demo Faculty: P. Verma',ARRAY['Water Testing'],ARRAY['Public Health'],ARRAY['Lab Testing']) ON CONFLICT DO NOTHING;
 INSERT INTO public.students(university_id,department_id,name,skills,study_year) VALUES
 (bau,ag,'Demo Student: Aarav Kumar',ARRAY['Soil Sampling','GIS'],3),(bau,ag,'Demo Student: Sunita Murmu',ARRAY['Agronomy','Field Surveys'],3),
 (bau,water,'Demo Student: Ravi Oraon',ARRAY['Irrigation','Water Testing'],2),(bau,water,'Demo Student: Neha Kumari',ARRAY['Hydrology','CAD'],4),
 (bau,cs,'Demo Student: Aman Singh',ARRAY['React','IoT'],3),(bau,cs,'Demo Student: Priya Soren',ARRAY['Python','Data Analysis'],2),
 (bau,cs,'Demo Student: Kiran Munda',ARRAY['Mobile Apps','UX'],3),(bau,ag,'Demo Student: Meera Devi',ARRAY['Farmer Training'],2),
 (bau,water,'Demo Student: Vikash Mahato',ARRAY['Sensors','Electronics'],4),(bau,cs,'Demo Student: Ritu Kumari',ARRAY['Machine Learning'],4) ON CONFLICT DO NOTHING;
END $$;
