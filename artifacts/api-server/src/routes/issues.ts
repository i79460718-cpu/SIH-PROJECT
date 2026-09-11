import { Router, type IRouter, type Request, type Response } from "express";
import { issueRepository } from "../domain/issueRepository.ts";
import { CreateIssueInputSchema, SupportIssueInputSchema, IssueStatusSchema } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /api/issues
router.get("/issues", async (req: Request, res: Response) => {
  try {
    const { district, category, priority, status, department, search } = req.query;
    const issues = await issueRepository.getIssues({
      district: typeof district === "string" ? district : undefined,
      category: typeof category === "string" ? category : undefined,
      priority: typeof priority === "string" ? priority : undefined,
      status: typeof status === "string" ? status : undefined,
      department: typeof department === "string" ? department : undefined,
      search: typeof search === "string" ? search : undefined,
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issues", details: String(error) });
  }
});

// POST /api/issues/analyse
router.post("/issues/analyse", async (req: Request, res: Response) => {
  try {
    const { description, location, category, urgency } = req.body;
    if (!description || typeof description !== "string") {
      res.status(400).json({ error: "Description is required" });
      return;
    }
    const analysis = await issueRepository.analyseReport({
      description,
      location,
      category,
      urgency,
    });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Analysis failed", details: String(error) });
  }
});

// POST /api/issues
router.post("/issues", async (req: Request, res: Response) => {
  try {
    const parseResult = CreateIssueInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Invalid issue data", details: parseResult.error.format() });
      return;
    }
    // Backend Mandatory Evidence Enforcement
    if (!parseResult.data.evidenceUrl) {
       res.status(400).json({ error: "Supporting evidence is mandatory." });
       return;
    }
    const issue = await issueRepository.createIssue(parseResult.data);
    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ error: "Failed to create issue", details: String(error) });
  }
});

// GET /api/issues/:id
router.get("/issues/:id", async (req: Request, res: Response) => {
  try {
    const issue = await issueRepository.getIssueById(req.params.id);
    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }
    const reports = await issueRepository.getReportsForIssue(issue.id);
    res.json({ ...issue, reports });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issue", details: String(error) });
  }
});

// POST /api/issues/:id/support
router.post("/issues/:id/support", async (req: Request, res: Response) => {
  try {
    const issue = await issueRepository.getIssueById(req.params.id);
    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }
    const parseResult = SupportIssueInputSchema.safeParse(req.body);
    const input = parseResult.success ? parseResult.data : {};
    const result = await issueRepository.supportIssue(issue.id, input);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to support issue", details: String(error) });
  }
});

// POST /api/issues/:id/assign
router.post("/issues/:id/assign", async (req: Request, res: Response) => {
  try {
    const { officerId } = req.body;
    if (!officerId) {
      res.status(400).json({ error: "officerId is required" });
      return;
    }
    const updated = await issueRepository.assignOfficer(req.params.id, officerId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign officer", details: String(error) });
  }
});

// POST /api/issues/:id/status
router.post("/issues/:id/status", async (req: Request, res: Response) => {
  try {
    const { status, comment, actor } = req.body;
    const parseStatus = IssueStatusSchema.safeParse(status);
    if (!parseStatus.success) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const updated = await issueRepository.updateStatus(req.params.id, parseStatus.data, comment, actor);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status", details: String(error) });
  }
});

// POST /api/issues/:id/evidence
router.post("/issues/:id/evidence", async (req: Request, res: Response) => {
  try {
    const { type, uploaderType, url, caption, officerName } = req.body;
    if (!url || !caption) {
      res.status(400).json({ error: "url and caption are required" });
      return;
    }
    const updated = await issueRepository.addEvidence(req.params.id, {
      type: type || "site_inspection",
      uploaderType: uploaderType || "officer",
      url,
      caption,
      officerName,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload evidence", details: String(error) });
  }
});

// POST /api/issues/:id/verify
router.post("/issues/:id/verify", async (req: Request, res: Response) => {
  try {
    const { confirmed, comment } = req.body;
    const updated = await issueRepository.verifyResolution(req.params.id, Boolean(confirmed), comment);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to verify resolution", details: String(error) });
  }
});

export default router;
