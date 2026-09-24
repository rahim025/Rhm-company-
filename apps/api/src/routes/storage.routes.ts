import { Router } from "express";
import multer from "multer";
import * as ctrl from "../controllers/storage.controller";

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.get("/", ctrl.listBuckets);
router.post("/", ctrl.createBucket);
router.delete("/:bucketId", ctrl.deleteBucket);

router.get("/:bucketName/files", ctrl.listFiles);
router.post("/:bucketName/files", upload.single("file"), ctrl.uploadFile);
router.get("/:bucketName/:fileName", ctrl.downloadFile);
router.get("/:bucketName/:fileName/signed-url", ctrl.getSignedUrl);
router.delete("/:bucketName/:fileName", ctrl.deleteFile);

export default router;
