import { Response } from "express";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";
import { listTables, getTableColumns } from "../services/schema.service";

// Génère automatiquement la documentation de l'API REST pour chaque table du projet.
export const getProjectDocs = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  const project = await prisma.project.findUniqueOrThrow({ where: { id: req.params.projectId } });
  const baseUrl = `${req.protocol}://${req.get("host")}/api/projects/${project.id}/data`;

  const tables = await listTables(project.dbSchema);
  const endpoints = await Promise.all(
    tables.map(async (table) => {
      const columns = await getTableColumns(project.dbSchema, table);
      const exampleBody = Object.fromEntries(
        columns.filter((c) => c.column_name !== "id").map((c) => [c.column_name, `<${c.data_type}>`])
      );
      return {
        table,
        columns,
        endpoints: [
          { method: "GET", path: `${baseUrl}/${table}`, description: "Lister les lignes (pagination, tri, recherche, filtres)", headers: { "x-api-key": "rhm_pub_... ou rhm_sec_..." } },
          { method: "GET", path: `${baseUrl}/${table}/:id`, description: "Récupérer une ligne par id", headers: { "x-api-key": "rhm_pub_... ou rhm_sec_..." } },
          { method: "POST", path: `${baseUrl}/${table}`, description: "Créer une ligne", headers: { "x-api-key": "rhm_sec_..." }, exampleBody },
          { method: "PATCH", path: `${baseUrl}/${table}/:id`, description: "Modifier une ligne", headers: { "x-api-key": "rhm_sec_..." }, exampleBody },
          { method: "DELETE", path: `${baseUrl}/${table}/:id`, description: "Supprimer une ligne", headers: { "x-api-key": "rhm_sec_..." } },
        ],
      };
    })
  );

  res.json({ project: project.name, baseUrl, tables: endpoints });
});
