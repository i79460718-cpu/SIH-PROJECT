-- ==============================================================================
-- JANSAMVAD AI — Comprehensive DEMO Seed (idempotent)
-- Creates interconnected demo records for the full SIH demo.
-- All records are marked DEMO via verificationStatus/dataOrigin where applicable.
-- Safe to re-run: uses ON CONFLICT / IF NOT EXISTS guards.
-- ==============================================================================

-- Ensure profiles.role supports all 5 roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('citizen','officer','admin','university_admin','industry_partner'));

-- Linkage columns (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry_partner_id UUID REFERENCES public.industry_partners(id) ON DELETE SET NULL;

-- Add DEMO labelling columns to universities / industry_partners if missing
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS data_origin TEXT DEFAULT 'PUBLIC_SOURCE';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VERIFIED';
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS data_origin TEXT DEFAULT 'PUBLIC_SOURCE';
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VERIFIED';

-- Add missing columns to projects that the portal expects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS methodology TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS technology TEXT;

-- Ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  industry_partner_id UUID REFERENCES public.industry_partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated update notifications" ON public.notifications;
CREATE POLICY "Authenticated update notifications" ON public.notifications FOR UPDATE USING (true);

-- RLS: ensure universities / industry_partners / projects are readable
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read universities" ON public.universities;
CREATE POLICY "Public read universities" ON public.universities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read industry_partners" ON public.industry_partners;
CREATE POLICY "Public read industry_partners" ON public.industry_partners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read projects" ON public.projects;
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "All authenticated CRUD projects" ON public.projects;
CREATE POLICY "All authenticated CRUD projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Ensure universities upsert helper via name uniqueness: create unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS uniq_universities_name ON public.universities(name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_industry_partners_name ON public.industry_partners(name);

-- ---------------------------------------------------------------------------
-- UNIVERSITIES (1 verified-public + 2 demo, with data_origin labelling)
-- ---------------------------------------------------------------------------
INSERT INTO public.universities (name, district, academic_disciplines, description, facilities, verified_at, source_url, data_origin, verification_status)
VALUES
  ('Birsa Agricultural University', 'Ranchi', ARRAY['Agriculture','Water Management','Rural Development'], 'Premier agricultural university — soil health, irrigation optimization, watershed management. Source: baujharkhand.org (PUBLIC_SOURCE).', ARRAY['Soil Testing Lab','Experimental Farms','Water Quality Center'], NOW(), 'https://baujharkhand.org', 'PUBLIC_SOURCE', 'VERIFIED'),
  ('National Institute of Technology Jamshedpur', 'Jamshedpur', ARRAY['Computer Science','Mechanical','Civil','Electrical','Metallurgy'], 'Institute of National Importance — multidisciplinary engineering. Source: nitjsr.ac.in (PUBLIC_SOURCE).', ARRAY['Central Workshop','High Performance Computing Lab','Incubation Centre'], NOW(), 'https://www.nitjsr.ac.in', 'PUBLIC_SOURCE', 'VERIFIED'),
  ('Central University of Jharkhand', 'Ranchi', ARRAY['Environmental Science','Water Engineering','Public Health','Education'], 'Central university — environment, water, and community health research. Source: cuj.ac.in (PUBLIC_SOURCE).', ARRAY['Environmental Lab','Community Health Centre','Field Research Station'], NOW(), 'https://cuj.ac.in', 'PUBLIC_SOURCE', 'VERIFIED')
ON CONFLICT (name) DO UPDATE SET district=EXCLUDED.district, academic_disciplines=EXCLUDED.academic_disciplines, description=EXCLUDED.description, facilities=EXCLUDED.facilities, source_url=EXCLUDED.source_url, data_origin=EXCLUDED.data_origin, verification_status=EXCLUDED.verification_status;

-- ---------------------------------------------------------------------------
-- INDUSTRY PARTNERS (2+)
-- ---------------------------------------------------------------------------
INSERT INTO public.industry_partners (name, type, industry_domain, expertise, funding_capacity, description, verified_at, source_url, data_origin, verification_status)
VALUES
  ('Jharkhand IoT Solutions', 'Startup', 'Smart City', ARRAY['IoT Sensors','Water Monitoring','Dashboarding'], '₹5L pilot + mentorship', 'Tech startup — smart city IoT for municipal challenges. DEMO record.', NOW(), 'https://jhiot-demo.example.com', 'DEMO', 'DEMO'),
  ('Ranchi AgriTech Collective', 'MSME', 'Agriculture', ARRAY['Precision Agriculture','Soil Analytics','Farmer Training'], '₹10L + field pilots', 'MSME collective — farmer-facing agri-tech pilots. DEMO record.', NOW(), 'https://agri-demo.example.com', 'DEMO', 'DEMO'),
  ('Jamshedpur Health Systems Pvt Ltd', 'Industry', 'Healthcare', ARRAY['Primary Care','Diagnostics','Community Outreach'], 'CSR + clinical trials', 'Industry partner — rural diagnostics & community health. DEMO record.', NOW(), 'https://health-demo.example.com', 'DEMO', 'DEMO')
ON CONFLICT (name) DO UPDATE SET type=EXCLUDED.type, industry_domain=EXCLUDED.industry_domain, expertise=EXCLUDED.expertise, funding_capacity=EXCLUDED.funding_capacity, description=EXCLUDED.description, source_url=EXCLUDED.source_url, data_origin=EXCLUDED.data_origin, verification_status=EXCLUDED.verification_status;

-- ---------------------------------------------------------------------------
-- CHALLENGES (issues) — 6 societal challenges across domains (DEMO data_origin)
-- Insert only if not already present (by public_id). public_id is unique.
-- ---------------------------------------------------------------------------
INSERT INTO public.issues (public_id, title, description, category, district, location_text, status, priority, priority_score, severity, report_count, duplicate_count)
VALUES
  ('JH-RAN-2026-DEMO1', 'Paddy soil degradation in Kanke block — declining yield', 'Farmers in Kanke report declining paddy yields linked to soil nutrient depletion and erratic irrigation. Request: soil mapping + micro-irrigation advisory. DEMO challenge.', 'Agriculture', 'Ranchi', 'Kanke Block, Ranchi', 'routed', 'high', 78, 'High', 4, 2),
  ('JH-RAN-2026-DEMO2', 'Community well water turbidity after monsoon', 'Well water turns turbid for weeks post-monsoon; filtration insufficient. Need low-cost community filtration + water testing kit. DEMO challenge.', 'Water Supply', 'Ranchi', 'Ormanjhi, Ranchi', 'reported', 'high', 72, 'High', 3, 1),
  ('JH-JAM-2026-DEMO3', 'Rural PHC patient triage delays', 'Primary Health Centre triage is manual; peak hours cause long waits for urgent cases. Need AI triage + ASHA worker app. DEMO challenge.', 'Healthcare', 'Jamshedpur', 'PHC, Potka, Jamshedpur', 'ai_verified', 'high', 80, 'High', 5, 1),
  ('JH-DHA-2026-DEMO4', 'Dropout risk among tribal residential school students', 'Seasonal migration causes learning gaps for residential students. Need offline-first learning + attendance nudge system. DEMO challenge.', 'Education', 'Dhanbad', 'Govt Residential School, Dhanbad', 'routed', 'medium', 58, 'Medium', 2, 0),
  ('JH-RAN-2026-DEMO5', 'Solid waste segregation compliance in urban wards', 'Door-to-door segregation compliance remains under 40%. Need behavioural nudges + ward-level tracking dashboard. DEMO challenge.', 'Environment', 'Ranchi', 'Ward 12, Ranchi Municipal Corp', 'reported', 'medium', 55, 'Medium', 3, 1),
  ('JH-BOK-2026-DEMO6', 'Post-harvest storage losses for smallholders', 'Smallholders store grain in gunny bags; pest and moisture losses high. Need low-cost hermetic storage + advisory. DEMO challenge.', 'Agriculture', 'Bokaro', 'Bermo Block, Bokaro', 'accepted', 'medium', 62, 'Medium', 2, 0)
ON CONFLICT (public_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PROJECTS (2+), TEAMS, MILESTONES, COLLABORATIONS — wired to universities
-- Use DO block to resolve FKs by name and avoid duplicate projects.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  bau_id UUID; nit_id UUID;
  iot_id UUID; agr_id UUID;
  iss1 UUID; iss3 UUID;
  p1 UUID; p2 UUID;
BEGIN
  SELECT id INTO bau_id FROM public.universities WHERE name='Birsa Agricultural University' LIMIT 1;
  SELECT id INTO nit_id FROM public.universities WHERE name='National Institute of Technology Jamshedpur' LIMIT 1;
  SELECT id INTO iot_id FROM public.industry_partners WHERE name='Jharkhand IoT Solutions' LIMIT 1;
  SELECT id INTO agr_id FROM public.industry_partners WHERE name='Ranchi AgriTech Collective' LIMIT 1;
  SELECT id INTO iss1 FROM public.issues WHERE public_id='JH-RAN-2026-DEMO1' LIMIT 1;
  SELECT id INTO iss3 FROM public.issues WHERE public_id='JH-JAM-2026-DEMO3' LIMIT 1;

  -- Project 1: Soil health advisory (BAU)
  IF bau_id IS NOT NULL AND iss1 IS NOT NULL THEN
    INSERT INTO public.projects (issue_id, university_id, industry_partner_id, title, status, description, impact_metrics)
    VALUES (iss1, bau_id, agr_id, 'Soil Health Mapping & Micro-Irrigation Advisory — Kanke', 'prototype', 'Soil sampling grid + advisory app for paddy farmers. DEMO project.', '{"farmers_reached": 120, "yield_uplift_pct": 12}')
    ON CONFLICT DO NOTHING;
    SELECT id INTO p1 FROM public.projects WHERE university_id=bau_id AND title='Soil Health Mapping & Micro-Irrigation Advisory — Kanke' LIMIT 1;
    IF p1 IS NOT NULL THEN
      INSERT INTO public.project_teams (project_id, students, disciplines) VALUES (p1, '[{"name":"Aarav Kumar","discipline":"Agriculture"},{"name":"Sunita Murmu","discipline":"Water Management"}]'::jsonb, ARRAY['Agriculture','Water Management']) ON CONFLICT DO NOTHING;
      INSERT INTO public.project_milestones (project_id, title, description, due_date, status) VALUES
        (p1, 'Soil sampling — 40 plots', 'Collect and test 40 farm plots', (CURRENT_DATE + INTERVAL '14 days')::date, 'pending'),
        (p1, 'Advisory app prototype', 'Farmer advisory with irrigation schedule', (CURRENT_DATE + INTERVAL '30 days')::date, 'pending'),
        (p1, 'Pilot — 20 farms', 'Pilot advisory with 20 farmers in Kanke', (CURRENT_DATE + INTERVAL '60 days')::date, 'pending')
      ON CONFLICT DO NOTHING;
      INSERT INTO public.collaborations (project_id, industry_partner_id, status, support_type)
      VALUES (p1, agr_id, 'active', ARRAY['mentorship','pilot'])
      ON CONFLICT DO NOTHING;
      INSERT INTO public.notifications (university_id, type, title, body)
      VALUES (bau_id, 'PROJECT_MILESTONE', 'Soil sampling milestone due in 14 days', 'Collect 40 farm plots for soil testing.')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Project 2: PHC triage app (NIT JSR)
  IF nit_id IS NOT NULL AND iss3 IS NOT NULL THEN
    INSERT INTO public.projects (issue_id, university_id, industry_partner_id, title, status, description, impact_metrics)
    VALUES (iss3, nit_id, iot_id, 'PHC AI Triage & ASHA Companion App — Potka', 'testing', 'Offline-first triage + ASHA worker companion. DEMO project.', '{"phcs_piloted": 2, "wait_time_reduction_pct": 28}')
    ON CONFLICT DO NOTHING;
    SELECT id INTO p2 FROM public.projects WHERE university_id=nit_id AND title='PHC AI Triage & ASHA Companion App — Potka' LIMIT 1;
    IF p2 IS NOT NULL THEN
      INSERT INTO public.project_teams (project_id, students, disciplines) VALUES (p2, '[{"name":"Rahul Verma","discipline":"CSE"},{"name":"Priya Soren","discipline":"Public Health"}]'::jsonb, ARRAY['CSE','Public Health']) ON CONFLICT DO NOTHING;
      INSERT INTO public.project_milestones (project_id, title, description, due_date, status) VALUES
        (p2, 'Triage model v1', 'Train triage classifier on synthetic PHC data', (CURRENT_DATE + INTERVAL '21 days')::date, 'pending'),
        (p2, 'ASHA app field test', 'Test companion app in 2 PHCs', (CURRENT_DATE + INTERVAL '45 days')::date, 'pending'),
        (p2, 'Pilot — Potka PHC', 'Pilot with real triage workflow', (CURRENT_DATE + INTERVAL '75 days')::date, 'pending')
      ON CONFLICT DO NOTHING;
      INSERT INTO public.collaborations (project_id, industry_partner_id, status, support_type)
      VALUES (p2, iot_id, 'interested', ARRAY['technical','testing'])
      ON CONFLICT DO NOTHING;
      INSERT INTO public.notifications (university_id, type, title, body)
      VALUES (nit_id, 'COLLABORATION_REQUEST', 'Industry interest: Jharkhand IoT Solutions', 'Jharkhand IoT Solutions expressed interest in PHC Triage project.')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Additional cross-cutting notifications
  IF bau_id IS NOT NULL THEN
    INSERT INTO public.notifications (university_id, type, title, body) VALUES
      (bau_id, 'CHALLENGE_MATCHED', 'New challenge matched: Kanke soil degradation', 'AI matched a high-priority agriculture challenge to your university.'),
      (bau_id, 'PROPOSAL_SUBMITTED', 'Proposal under review: Soil Health Mapping', 'Your proposal is under review by the validation cell.')
    ON CONFLICT DO NOTHING;
  END IF;
  IF nit_id IS NOT NULL THEN
    INSERT INTO public.notifications (university_id, type, title, body) VALUES
      (nit_id, 'CHALLENGE_MATCHED', 'New challenge matched: PHC triage delays', 'High-priority healthcare challenge recommended for NIT Jamshedpur.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Ensure RLS policies allow reads for anon where needed (for demo)
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
