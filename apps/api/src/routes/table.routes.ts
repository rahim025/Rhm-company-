import { Router } from "express";
import * as ctrl from "../controllers/table.controller";

const router = Router({ mergeParams: true });

router.get("/", ctrl.listTables);
router.post("/", ctrl.createTable);
router.get("/:tableName", ctrl.getTable);
router.patch("/:tableName", ctrl.renameTable);
router.delete("/:tableName", ctrl.dropTable);
router.post("/:tableName/columns", ctrl.addColumn);
router.patch("/:tableName/columns/:columnName", ctrl.renameColumn);
router.delete("/:tableName/columns/:columnName", ctrl.dropColumn);
router.post("/:tableName/foreign-keys", ctrl.addForeignKey);

export default router;
