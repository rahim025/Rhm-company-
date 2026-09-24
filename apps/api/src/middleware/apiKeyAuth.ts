import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { hashApiKey } from "../utils/apiKey";
import { AppError } from "../utils/AppError";

export interface ApiKeyRequest extends Request {
  apiKeyType?: "PUBLIC" | "SECRET";
  apiProjectId?: string;
}

// Authentifie les appels à l'API REST auto-générée via header `x-api-key`.
// Les clés SECRET donnent accès en écriture ; les clés PUBLIC sont lecture seule
// (comportement par défaut, ajustable via les permissions de table plus tard).
export async function requireApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (!key) {
    return next(new AppError("En-tête x-api-key manquant.", 401));
  }
  const keyHash = hashApiKey(key);
  const record = await prisma.apiKey.findFirst({ where: { keyHash, revokedAt: null } });
  if (!record) {
    return next(new AppError("Clé API invalide ou révoquée.", 401));
  }
  const projectIdInPath = req.params.projectId;
  if (projectIdInPath && projectIdInPath !== record.projectId) {
    return next(new AppError("Cette clé API n'appartient pas à ce projet.", 403));
  }

  if (req.method !== "GET" && record.type === "PUBLIC") {
    return next(new AppError("Une clé publique ne peut pas effectuer d'écritures. Utilisez une clé secrète.", 403));
  }

  req.apiKeyType = record.type;
  req.apiProjectId = record.projectId;

  prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  next();
}
