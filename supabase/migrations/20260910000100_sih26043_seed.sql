-- 4. DEMO SEED DATA (Labelled as DEMO)
-- Seed Birsa Agricultural University
INSERT INTO public.universities (name, district, academic_disciplines, description, facilities, verified_at, source_url)
VALUES (
  'Birsa Agricultural University',
  'Ranchi',
  ARRAY['Agriculture', 'Water Management', 'Rural Development'],
  'Premier agricultural institution focusing on sustainable farming, irrigation optimization, and soil health.',
  ARRAY['Soil Testing Lab', 'Experimental Farms', 'Water Quality Center'],
  NOW(),
  'https://baujharkhand.org'
) ON CONFLICT DO NOTHING;

-- Seed Demo Industry Partner
INSERT INTO public.industry_partners (name, type, industry_domain, expertise, description, verified_at, source_url)
VALUES (
  'Jharkhand IoT Solutions',
  'Startup',
  'Smart City',
  ARRAY['IoT Sensors', 'Water Monitoring', 'Dashboarding'],
  'Tech startup focused on smart city solutions for municipal problems.',
  NOW(),
  'https://jhiot-demo.example.com'
) ON CONFLICT DO NOTHING;

-- Create demo Admin for University
-- Note: This assumes you have created the user in Auth with the email university.admin@baujharkhand.org
-- The trigger or profile creation logic in Supabase should handle this automatically once the user signs up
