import { Response } from "express";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";

export const listLogs = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  const { page = "1", perPage = "50", method, statusCode, search } = req.query as Record<string, string>;
  const take = Math.min(200, parseInt(perPage, 10) || 50);
  const skip = ((parseInt(page, 10) || 1) - 1) * take;

  const where: any = { projectId: req.params.projectId };
  if (method) where.method = method;
  if (statusCode) where.statusCode = parseInt(statusCode, 10);
  if (search) where.endpoint = { contains: search, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ data: logs, pagination: { total, page: parseInt(page, 10) || 1, perPage: take } });
});
