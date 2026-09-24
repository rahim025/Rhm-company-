import { Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";
import { AppError } from "../utils/AppError";
import * as storage from "../services/storage.service";

export const listBuckets = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  const buckets = await prisma.storageBucket.findMany({ where: { projectId: req.params.projectId } });
  res.json(buckets);
});

export const createBucket = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const body = z.object({ name: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/), isPublic: z.boolean().optional() }).parse(req.body);
  const bucket = await prisma.storageBucket.create({
    data: { projectId: req.params.projectId, name: body.name, isPublic: body.isPublic ?? false },
  });
  storage.ensureBucketDir(req.params.projectId, body.name);
  res.status(201).json(bucket);
});

export const deleteBucket = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  await prisma.storageBucket.delete({ where: { id: req.params.bucketId } }).catch(() => {
    throw new AppError("Bucket introuvable.", 404);
  });
  res.status(204).send();
});

async function getBucket(projectId: string, bucketName: string) {
  const bucket = await prisma.storageBucket.findUnique({ where: { projectId_name: { projectId, name: bucketName } } });
  if (!bucket) throw new AppError("Bucket introuvable.", 404);
  return bucket;
}

export const listFiles = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  await getBucket(req.params.projectId, req.params.bucketName);
  const files = storage.listFiles(req.params.projectId, req.params.bucketName);
  res.json({ files });
});

export const uploadFile = asyncHandler(async (req: AuthedRequest & { file?: Express.Multer.File }, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN", "MEMBER"]);
  await getBucket(req.params.projectId, req.params.bucketName);
  if (!req.file) throw new AppError("Aucun fichier fourni (champ 'file').", 400);
  const fileName = storage.saveFile(req.params.projectId, req.params.bucketName, req.file.originalname, req.file.buffer);
  res.status(201).json({ fileName });
});

export const downloadFile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const bucket = await getBucket(req.params.projectId, req.params.bucketName);
  if (!bucket.isPublic) {
    const { expires, signature } = req.query as Record<string, string>;
    if (!expires || !signature) throw new AppError("URL signée requise pour un bucket privé.", 401);
    let valid = false;
    try {
      valid = storage.verifySignedUrl(req.params.projectId, req.params.bucketName, req.params.fileName, expires, signature);
    } catch {
      valid = false;
    }
    if (!valid) throw new AppError("URL signée invalide ou expirée.", 401);
  }
  const buffer = storage.readFile(req.params.projectId, req.params.bucketName, req.params.fileName);
  res.send(buffer);
});

export const getSignedUrl = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  await getBucket(req.params.projectId, req.params.bucketName);
  const url = storage.generateSignedUrl(req.params.projectId, req.params.bucketName, req.params.fileName);
  res.json({ url, expiresIn: 3600 });
});

export const deleteFile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  await getBucket(req.params.projectId, req.params.bucketName);
  storage.deleteFile(req.params.projectId, req.params.bucketName, req.params.fileName);
  res.status(204).send();
});
