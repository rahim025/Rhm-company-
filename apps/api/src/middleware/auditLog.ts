import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AuthedRequest } from "./auth";
import { ApiKeyRequest } from "./apiKeyAuth";

// Journalise chaque requête API (endpoint, méthode, statut, durée, IP).
// Utilisé pour la page "Logs" du dashboard.
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const authedReq = req as AuthedRequest & ApiKeyRequest;
    prisma.auditLog
      .create({
        data: {
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: res.statusCode,
          ipAddress: req.ip,
          durationMs,
          action: `${req.method} ${req.baseUrl}`,
          userId: authedReq.userId ?? null,
          projectId: authedReq.apiProjectId ?? (req.params?.projectId || null),
        },
      })
      .catch((e: unknown) => console.error("Échec de l'écriture du log d'audit", e));
  });
  next();
}
