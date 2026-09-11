ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry_partner_id UUID REFERENCES public.industry_partners(id) ON DELETE SET NULL;
