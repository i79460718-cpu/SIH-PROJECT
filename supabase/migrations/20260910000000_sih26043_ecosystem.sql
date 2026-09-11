-- ==============================================================================
-- JANSAMVAD AI — SIH26043 Ecosystem Migration (Complete)
-- ==============================================================================

-- 1. UNIVERSITIES & PARTNERS
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  academic_disciplines TEXT[],
  description TEXT,
  faculty_expertise TEXT[],
  facilities TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.industry_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Industry', 'Startup', 'MSME', 'CSR', 'Research', 'Innovation')),
  industry_domain TEXT,
  expertise TEXT[],
  funding_capacity TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROJECTS & TEAMS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  industry_partner_id UUID REFERENCES public.industry_partners(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposal' CHECK (status IN (
    'proposal', 'team_formed', 'prototype', 'testing', 'pilot', 'deployed', 'completed'
  )),
  impact_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  faculty_mentor_id UUID,
  students JSONB DEFAULT '[]', -- List of student details {name, discipline}
  disciplines TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);

-- RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Public read industry_partners" ON public.industry_partners FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "All authenticated CRUD projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated CRUD teams" ON public.project_teams FOR ALL USING (auth.role() = 'authenticated');
-- 3. COLLABORATIONS & PROFILES
CREATE TABLE IF NOT EXISTS public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  industry_partner_id UUID REFERENCES public.industry_partners(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'interested', 'accepted', 'active', 'completed', 'declined')),
  support_type TEXT[], -- ['mentorship', 'funding', 'technical', 'prototyping', 'testing', 'pilot']
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metadata for Directory Credibility
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.industry_partners ADD COLUMN IF NOT EXISTS source_url TEXT;

