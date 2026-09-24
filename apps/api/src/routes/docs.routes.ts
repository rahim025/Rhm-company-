import { Router } from "express";
import * as ctrl from "../controllers/docs.controller";

const router = Router({ mergeParams: true });
router.get("/", ctrl.getProjectDocs);
export default router;
