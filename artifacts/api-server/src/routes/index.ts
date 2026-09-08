import { Router, type IRouter } from "express";
import healthRouter from "./health.ts";
import issuesRouter from "./issues.ts";
import dashboardRouter from "./dashboard.ts";
import challengesRouter from "./challenges.ts";
import partnersRouter from "./partners.ts";
import insightsRouter from "./insights.ts";
import aiRouter from "./ai.ts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(issuesRouter);
router.use(dashboardRouter);
router.use(challengesRouter);
router.use(partnersRouter);
router.use(insightsRouter);
router.use(aiRouter);

export default router;
