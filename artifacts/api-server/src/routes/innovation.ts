import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// Get Dashboard Metrics for an Industry Partner
router.get("/metrics/industry/:partnerId", async (req, res) => {
  const { partnerId } = req.params;

  // Use Promise.all to fetch metrics in parallel
  const [
    { count: recommendedCount },
    { count: activeCount },
    { count: pendingCount },
    { count: testingCount },
    { data: fundingData }
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: 'exact', head: true }), // Simplification
    supabase.from("collaborations").select("*", { count: 'exact', head: true }).eq("industry_partner_id", partnerId).eq("status", "active"),
    supabase.from("collaborations").select("*", { count: 'exact', head: true }).eq("industry_partner_id", partnerId).eq("status", "requested"),
    supabase.from("collaborations").select("*", { count: 'exact', head: true }).eq("industry_partner_id", partnerId).contains("support_type", ["testing"]),
    supabase.from("projects").select("impact_metrics").eq("industry_partner_id", partnerId),
  ]);

  const totalFunding = 0; // Simplified for demo as a number

  res.json({
    recommendedProjects: recommendedCount || 0,
    activeCollaborations: activeCount || 0,
    requestsPending: pendingCount || 0,
    testingSupports: testingCount || 0,
    fundingActive: totalFunding,
    impactRecorded: fundingData?.length || 0,
  });
});

// Proposals
router.post("/proposals", async (req, res) => {
  const { project_id, methodology, technology, team } = req.body;
  const { data, error } = await supabase.from("projects")
    .update({ status: 'proposal', methodology, technology })
    .eq('id', project_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
