import { Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";
import * as schemaService from "../services/schema.service";

const columnSchema = z.object({
  name: z.string().min(1).max(63),
  type: z.string().min(1),
  primaryKey: z.boolean().optional(),
  unique: z.boolean().optional(),
  notNull: z.boolean().optional(),
  default: z.string().optional(),
});

const createTableBody = z.object({
  name: z.string().min(1).max(63),
  columns: z.array(columnSchema).min(1),
});

async function getProjectSchema(projectId: string, userId: string, minRoles?: string[]) {
  await assertMember(userId, projectId, minRoles);
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  return project.dbSchema;
}

export const listTables = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!);
  const tables = await schemaService.listTables(schema);
  res.json({ tables });
});

export const getTable = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!);
  const columns = await schemaService.getTableColumns(schema, req.params.tableName);
  res.json({ name: req.params.tableName, columns });
});

export const createTable = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN", "MEMBER"]);
  const body = createTableBody.parse(req.body);
  await schemaService.createTable(schema, body.name, body.columns);
  res.status(201).json({ message: `Table "${body.name}" créée.` });
});

export const dropTable = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN"]);
  await schemaService.dropTable(schema, req.params.tableName);
  res.status(204).send();
});

export const renameTable = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN", "MEMBER"]);
  const { newName } = z.object({ newName: z.string().min(1).max(63) }).parse(req.body);
  await schemaService.renameTable(schema, req.params.tableName, newName);
  res.json({ message: "Table renommée." });
});

export const addColumn = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN", "MEMBER"]);
  const col = columnSchema.parse(req.body);
  await schemaService.addColumn(schema, req.params.tableName, col);
  res.status(201).json({ message: "Colonne ajoutée." });
});

export const dropColumn = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN"]);
  await schemaService.dropColumn(schema, req.params.tableName, req.params.columnName);
  res.status(204).send();
});

export const renameColumn = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN", "MEMBER"]);
  const { newName } = z.object({ newName: z.string().min(1).max(63) }).parse(req.body);
  await schemaService.renameColumn(schema, req.params.tableName, req.params.columnName, newName);
  res.json({ message: "Colonne renommée." });
});

export const addForeignKey = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const schema = await getProjectSchema(req.params.projectId, req.userId!, ["OWNER", "ADMIN"]);
  const body = z
    .object({ column: z.string(), refTable: z.string(), refColumn: z.string() })
    .parse(req.body);
  await schemaService.addForeignKey(schema, req.params.tableName, body.column, body.refTable, body.refColumn);
  res.status(201).json({ message: "Relation créée." });
});
