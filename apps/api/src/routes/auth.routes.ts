import { Router } from "express";
import * as ctrl from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/register", authRateLimiter, ctrl.register);
router.post("/login", authRateLimiter, ctrl.login);
router.post("/logout", requireAuth, ctrl.logout);
router.get("/me", requireAuth, ctrl.me);
router.get("/verify-email/:token", ctrl.verifyEmail);
router.post("/forgot-password", authRateLimiter, ctrl.requestPasswordReset);
router.post("/reset-password", authRateLimiter, ctrl.resetPassword);

export default router;
