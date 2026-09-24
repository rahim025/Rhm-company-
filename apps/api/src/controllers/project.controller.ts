import { Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthedRequest } from "../middleware/auth";
import { createProjectSchema as provisionSchema, dropProjectSchema } from "../services/schema.service";

const createProjectBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return `${base || "project"}_${nanoid(6).toLowerCase()}`;
}

export const listProjects = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.userId },
    include: { project: true },
    orderBy: { project: { createdAt: "desc" } },
  });
  res.json(memberships.map((m) => ({ ...m.project, role: m.role })));
});

export const createProject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const body = createProjectBody.parse(req.body);
  const slug = slugify(body.name);
  const dbSchema = `proj_${slug}`;

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: { name: body.name, description: body.description, slug, dbSchema },
    });
    await tx.projectMember.create({
      data: { userId: req.userId!, projectId: p.id, role: "OWNER" },
    });
    return p;
  });

  // Provisionne le schéma Postgres réel pour ce projet.
  await provisionSchema(dbSchema);

  res.status(201).json({
    ...project,
    apiUrl: `${req.protocol}://${req.get("host")}/api/projects/${project.id}`,
  });
});

async function assertMember(userId: string, projectId: string, minRoles?: string[]) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership) throw new AppError("Projet introuvable ou accès refusé.", 404);
  if (minRoles && !minRoles.includes(membership.role)) {
    throw new AppError("Permissions insuffisantes pour cette action.", 403);
  }
  return membership;
}

export const getProject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  const membership = await assertMember(req.userId!, projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Projet introuvable.", 404);

  const [tableCount, apiKeyCount, recentLogs] = await Promise.all([
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int as count FROM information_schema.tables WHERE table_schema = $1`,
      project.dbSchema
    ),
    prisma.apiKey.count({ where: { projectId, revokedAt: null } }),
    prisma.auditLog.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  res.json({
    ...project,
    role: membership.role,
    stats: {
      tableCount: tableCount[0]?.count ?? 0,
      apiKeyCount,
    },
    recentActivity: recentLogs,
  });
});

export const updateProject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  await assertMember(req.userId!, projectId, ["OWNER", "ADMIN"]);
  const body = createProjectBody.partial().parse(req.body);
  const project = await prisma.project.update({ where: { id: projectId }, data: body });
  res.json(project);
});

export const deleteProject = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  await assertMember(req.userId!, projectId, ["OWNER"]);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Projet introuvable.", 404);

  await dropProjectSchema(project.dbSchema);
  await prisma.project.delete({ where: { id: projectId } });
  res.status(204).send();
});

export { assertMember };
