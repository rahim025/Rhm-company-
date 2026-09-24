import { Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";
import { generateApiKey } from "../utils/apiKey";
import { AppError } from "../utils/AppError";

export const listApiKeys = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  const keys = await prisma.apiKey.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
  });
  res.json(keys);
});

export const createApiKey = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const body = z.object({ type: z.enum(["PUBLIC", "SECRET"]), name: z.string().min(1).max(100) }).parse(req.body);

  const { fullKey, prefix, keyHash } = generateApiKey(body.type);
  const key = await prisma.apiKey.create({
    data: { projectId: req.params.projectId, type: body.type, name: body.name, prefix, keyHash },
  });

  // La clé complète n'est renvoyée QU'ICI, une seule fois. Elle n'est jamais récupérable ensuite.
  res.status(201).json({
    id: key.id,
    type: key.type,
    name: key.name,
    prefix: key.prefix,
    fullKey,
    createdAt: key.createdAt,
    warning: "Cette clé ne sera plus jamais affichée. Copiez-la maintenant.",
  });
});

export const revokeApiKey = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const key = await prisma.apiKey.findUnique({ where: { id: req.params.keyId } });
  if (!key || key.projectId !== req.params.projectId) throw new AppError("Clé introuvable.", 404);
  await prisma.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
  res.json({ message: "Clé révoquée." });
});

export const rotateApiKey = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const old = await prisma.apiKey.findUnique({ where: { id: req.params.keyId } });
  if (!old || old.projectId !== req.params.projectId) throw new AppError("Clé introuvable.", 404);

  const { fullKey, prefix, keyHash } = generateApiKey(old.type);
  const [, created] = await prisma.$transaction([
    prisma.apiKey.update({ where: { id: old.id }, data: { revokedAt: new Date() } }),
    prisma.apiKey.create({ data: { projectId: old.projectId, type: old.type, name: old.name, prefix, keyHash } }),
  ]);
  res.status(201).json({ id: created.id, prefix: created.prefix, fullKey, warning: "Nouvelle clé — copiez-la maintenant." });
});

export const deleteApiKey = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const key = await prisma.apiKey.findUnique({ where: { id: req.params.keyId } });
  if (!key || key.projectId !== req.params.projectId) throw new AppError("Clé introuvable.", 404);
  await prisma.apiKey.delete({ where: { id: key.id } });
  res.status(204).send();
});
