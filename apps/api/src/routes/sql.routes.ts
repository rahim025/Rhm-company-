import { Router } from "express";
import * as ctrl from "../controllers/sql.controller";

const router = Router({ mergeParams: true });
router.post("/", ctrl.executeSql);
export default router;
