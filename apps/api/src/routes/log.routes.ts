import { Router } from "express";
import * as ctrl from "../controllers/log.controller";

const router = Router({ mergeParams: true });
router.get("/", ctrl.listLogs);
export default router;
