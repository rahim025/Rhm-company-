import { Router } from "express";
import * as ctrl from "../controllers/data.controller";
import { requireApiKey } from "../middleware/apiKeyAuth";

// API REST auto-générée, publique (authentifiée par clé API et non par JWT).
// Montée sous /api/projects/:projectId/data/:tableName
const router = Router({ mergeParams: true });
router.use(requireApiKey);

router.get("/:tableName", ctrl.listRows);
router.get("/:tableName/:id", ctrl.getRowById);
router.post("/:tableName", ctrl.createRow);
router.patch("/:tableName/:id", ctrl.updateRowById);
router.delete("/:tableName/:id", ctrl.deleteRowById);

export default router;
