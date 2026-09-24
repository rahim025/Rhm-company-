import { Response } from "express";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiKeyRequest } from "../middleware/apiKeyAuth";
import * as dataService from "../services/data.service";
import { AppError } from "../utils/AppError";
import { dispatchEvent } from "../services/webhook.service";
import { dispatchRealtimeEvent } from "../services/realtime.service";

// Toutes les routes ici sont montées sous /api/projects/:projectId/data/:tableName
// et protégées par requireApiKey (clé publique = lecture seule, clé secrète = lecture/écriture).

async function resolveSchema(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Projet introuvable.", 404);
  return project.dbSchema;
}

export const listRows = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const schema = await resolveSchema(req.params.projectId);
  const { page, perPage, sort, search, ...filters } = req.query as Record<string, string>;
  const result = await dataService.listRows(schema, req.params.tableName, {
    page: page ? parseInt(page, 10) : undefined,
    perPage: perPage ? parseInt(perPage, 10) : undefined,
    sort,
    search,
    filters,
  });
  res.json(result);
});

export const getRowById = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const schema = await resolveSchema(req.params.projectId);
  const row = await dataService.getRow(schema, req.params.tableName, "id", req.params.id);
  res.json(row);
});

function notify(projectId: string, table: string, type: "INSERT" | "UPDATE" | "DELETE", record: unknown) {
  dispatchRealtimeEvent(projectId, table, type, record);
  void dispatchEvent(projectId, `${table}.${type}`, record);
}

export const createRow = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const schema = await resolveSchema(req.params.projectId);
  const row = await dataService.insertRow(schema, req.params.tableName, req.body);
  notify(req.params.projectId, req.params.tableName, "INSERT", row);
  res.status(201).json(row);
});

export const updateRowById = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const schema = await resolveSchema(req.params.projectId);
  const row = await dataService.updateRow(schema, req.params.tableName, "id", req.params.id, req.body);
  notify(req.params.projectId, req.params.tableName, "UPDATE", row);
  res.json(row);
});

export const deleteRowById = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const schema = await resolveSchema(req.params.projectId);
  await dataService.deleteRow(schema, req.params.tableName, "id", req.params.id);
  notify(req.params.projectId, req.params.tableName, "DELETE", { id: req.params.id });
  res.status(204).send();
});
