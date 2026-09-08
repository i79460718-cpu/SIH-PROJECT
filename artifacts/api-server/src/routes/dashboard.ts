import { Router, type IRouter, type Request, type Response } from "express";
import { issueRepository } from "../domain/issueRepository.ts";

const router: IRouter = Router();

// GET /api/dashboard/summary
router.get("/dashboard/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await issueRepository.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard summary", details: String(error) });
  }
});

// GET /api/dashboard/department
router.get("/dashboard/department", async (_req: Request, res: Response) => {
  try {
    const departments = await issueRepository.getDepartments();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: "Failed to load departments", details: String(error) });
  }
});

// GET /api/officers
router.get("/officers", async (_req: Request, res: Response) => {
  try {
    const officers = await issueRepository.getOfficers();
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: "Failed to load officers", details: String(error) });
  }
});

// GET /api/officers/:id/assignments
router.get("/officers/:id/assignments", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const allIssues = await issueRepository.getIssues();
    const assignedIssues = allIssues.filter(i => i.assignedOfficer?.id === id);
    res.json(assignedIssues);
  } catch (error) {
    res.status(500).json({ error: "Failed to load officer assignments", details: String(error) });
  }
});

export default router;
