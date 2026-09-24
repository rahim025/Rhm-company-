import { Router } from "express";
import * as ctrl from "../controllers/project.controller";
import { requireAuth } from "../middleware/auth";
import tableRoutes from "./table.routes";
import apikeyRoutes from "./apikey.routes";
import logRoutes from "./log.routes";
import sqlRoutes from "./sql.routes";
import docsRoutes from "./docs.routes";
import webhookRoutes from "./webhook.routes";
import storageRoutes from "./storage.routes";

const router = Router();
router.use(requireAuth);

router.get("/", ctrl.listProjects);
router.post("/", ctrl.createProject);
router.get("/:projectId", ctrl.getProject);
router.patch("/:projectId", ctrl.updateProject);
router.delete("/:projectId", ctrl.deleteProject);

router.use("/:projectId/tables", tableRoutes);
router.use("/:projectId/keys", apikeyRoutes);
router.use("/:projectId/logs", logRoutes);
router.use("/:projectId/sql", sqlRoutes);
router.use("/:projectId/docs", docsRoutes);
router.use("/:projectId/webhooks", webhookRoutes);
router.use("/:projectId/storage", storageRoutes);

export default router;
