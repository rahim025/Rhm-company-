import { Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";
import { runRawQuery } from "../services/data.service";
import { AppError } from "../utils/AppError";

const FORBIDDEN_PATTERN = /\b(pg_read_file|pg_ls_dir|copy\s+.+\s+(to|from)\s+program|dblink)\b/i;

export const executeSql = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN", "MEMBER"]);
  const { query } = z.object({ query: z.string().min(1).max(20000) }).parse(req.body);

  if (FORBIDDEN_PATTERN.test(query)) {
    throw new AppError("Cette requête utilise une fonction non autorisée.", 403);
  }

  const project = await prisma.project.findUniqueOrThrow({ where: { id: req.params.projectId } });
  try {
    const result = await runRawQuery(project.dbSchema, query);
    res.json(result);
  } catch (e: any) {
    // On renvoie le message d'erreur Postgres tel quel pour aider au debug dans l'éditeur SQL.
    throw new AppError(e.message ?? "Erreur SQL.", 400);
  }
});
