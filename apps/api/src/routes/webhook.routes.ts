import { Router } from "express";
import * as ctrl from "../controllers/webhook.controller";

const router = Router({ mergeParams: true });
router.get("/", ctrl.listWebhooks);
router.post("/", ctrl.createWebhook);
router.delete("/:webhookId", ctrl.deleteWebhook);
router.get("/:webhookId/deliveries", ctrl.listWebhookDeliveries);
export default router;
