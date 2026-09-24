import { Router } from "express";
import * as ctrl from "../controllers/apikey.controller";

const router = Router({ mergeParams: true });

router.get("/", ctrl.listApiKeys);
router.post("/", ctrl.createApiKey);
router.post("/:keyId/rotate", ctrl.rotateApiKey);
router.post("/:keyId/revoke", ctrl.revokeApiKey);
router.delete("/:keyId", ctrl.deleteApiKey);

export default router;
