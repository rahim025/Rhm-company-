import { pgPool } from "../db/pg";
import { assertValidIdentifier, quoteIdent, quoteQualified } from "../utils/identifiers";
import { AppError } from "../utils/AppError";
import { getTableColumns } from "./schema.service";

export interface ListParams {
  page?: number;
  perPage?: number;
  sort?: string;   // ex: "-createdAt" (desc) ou "name" (asc)
  search?: string; // recherche texte libre sur toutes les colonnes texte
  filters?: Record<string, string>; // ex: { "status": "active" } -> égalité stricte
}

async function assertColumnExists(schema: string, table: string, column: string) {
  const cols = await getTableColumns(schema, table);
  if (!cols.find((c) => c.column_name === column)) {
    throw new AppError(`Colonne inconnue: "${column}".`, 400);
  }
  return cols;
}

export async function listRows(schema: string, table: string, params: ListParams) {
  assertValidIdentifier(table, "nom de table");
  const columns = await getTableColumns(schema, table);
  if (!columns.length) throw new AppError(`Table "${table}" introuvable.`, 404);

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(200, Math.max(1, params.perPage ?? 25));
  const offset = (page - 1) * perPage;

  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.filters) {
    for (const [col, val] of Object.entries(params.filters)) {
      if (!columns.find((c) => c.column_name === col)) continue; // ignore silencieusement les colonnes inconnues
      whereClauses.push(`${quoteIdent(col)} = $${idx++}`);
      values.push(val);
    }
  }

  if (params.search) {
    const textCols = columns.filter((c) =>
      ["text", "character varying", "varchar"].includes(c.data_type)
    );
    if (textCols.length) {
      const searchClauses = textCols.map((c) => `${quoteIdent(c.column_name)} ILIKE $${idx}`);
      values.push(`%${params.search}%`);
      idx++;
      whereClauses.push(`(${searchClauses.join(" OR ")})`);
    }
  }

  let orderSql = "";
  if (params.sort) {
    const desc = params.sort.startsWith("-");
    const col = desc ? params.sort.slice(1) : params.sort;
    if (columns.find((c) => c.column_name === col)) {
      orderSql = `ORDER BY ${quoteIdent(col)} ${desc ? "DESC" : "ASC"}`;
    }
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const tableSql = quoteQualified(schema, table);

  const countResult = await pgPool.query(`SELECT COUNT(*)::int AS count FROM ${tableSql} ${whereSql}`, values);
  const total = countResult.rows[0].count as number;

  values.push(perPage, offset);
  const dataResult = await pgPool.query(
    `SELECT * FROM ${tableSql} ${whereSql} ${orderSql} LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return {
    data: dataResult.rows,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function getRow(schema: string, table: string, idColumn: string, id: string) {
  await assertColumnExists(schema, table, idColumn);
  const { rows } = await pgPool.query(
    `SELECT * FROM ${quoteQualified(schema, table)} WHERE ${quoteIdent(idColumn)} = $1 LIMIT 1`,
    [id]
  );
  if (!rows[0]) throw new AppError("Enregistrement introuvable.", 404);
  return rows[0];
}

export async function insertRow(schema: string, table: string, data: Record<string, unknown>) {
  const columns = await getTableColumns(schema, table);
  const entries = Object.entries(data).filter(([col]) => columns.find((c) => c.column_name === col));
  if (!entries.length) throw new AppError("Aucune colonne valide fournie.", 400);

  const colNames = entries.map(([col]) => quoteIdent(col)).join(", ");
  const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
  const values = entries.map(([, v]) => v);

  const { rows } = await pgPool.query(
    `INSERT INTO ${quoteQualified(schema, table)} (${colNames}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0];
}

export async function updateRow(
  schema: string,
  table: string,
  idColumn: string,
  id: string,
  data: Record<string, unknown>
) {
  const columns = await assertColumnExists(schema, table, idColumn);
  const entries = Object.entries(data).filter(([col]) => columns.find((c) => c.column_name === col) && col !== idColumn);
  if (!entries.length) throw new AppError("Aucune colonne valide à mettre à jour.", 400);

  const setSql = entries.map(([col], i) => `${quoteIdent(col)} = $${i + 1}`).join(", ");
  const values = entries.map(([, v]) => v);
  values.push(id);

  const { rows } = await pgPool.query(
    `UPDATE ${quoteQualified(schema, table)} SET ${setSql} WHERE ${quoteIdent(idColumn)} = $${values.length} RETURNING *`,
    values
  );
  if (!rows[0]) throw new AppError("Enregistrement introuvable.", 404);
  return rows[0];
}

export async function deleteRow(schema: string, table: string, idColumn: string, id: string) {
  await assertColumnExists(schema, table, idColumn);
  const { rowCount } = await pgPool.query(
    `DELETE FROM ${quoteQualified(schema, table)} WHERE ${quoteIdent(idColumn)} = $1`,
    [id]
  );
  if (!rowCount) throw new AppError("Enregistrement introuvable.", 404);
}

export async function runRawQuery(schema: string, sql: string) {
  // SQL Editor : on limite l'exécution au search_path du schéma du projet,
  // et on exécute dans une transaction en lecture par défaut serait plus strict,
  // mais on autorise ici les requêtes DML/DDL volontairement (fonctionnalité avancée),
  // en s'appuyant sur le fait que l'utilisateur est authentifié et propriétaire du projet.
  const client = await pgPool.connect();
  const start = Date.now();
  try {
    await client.query(`SET search_path TO ${quoteIdent(schema)}`);
    const result = await client.query(sql);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      durationMs: Date.now() - start,
      fields: result.fields?.map((f) => f.name) ?? [],
    };
  } finally {
    client.release();
  }
}
