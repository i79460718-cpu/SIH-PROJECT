import { Router, type IRouter } from "express";
import healthRouter from "./health";
import issuesRouter from "./issues";
import dashboardRouter from "./dashboard";
import challengesRouter from "./challenges";
import partnersRouter from "./partners";
import insightsRouter from "./insights";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(issuesRouter);
router.use(dashboardRouter);
router.use(challengesRouter);
router.use(partnersRouter);
router.use(insightsRouter);
router.use(aiRouter);

export default router;
