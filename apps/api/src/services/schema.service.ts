import { pgPool } from "../db/pg";
import { assertValidColumnType, assertValidIdentifier, quoteIdent, quoteQualified } from "../utils/identifiers";
import { AppError } from "../utils/AppError";

export interface ColumnDef {
  name: string;
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  notNull?: boolean;
  default?: string; // valeur littérale déjà validée / connue (ex: "now()", "0", "'active'")
}

// Provisionne un schéma Postgres dédié à un projet. Chaque projet = un schéma isolé,
// ce qui permet d'avoir plusieurs projets sur la même base Postgres sans collision
// de noms de table, et facilite la suppression complète d'un projet (DROP SCHEMA).
export async function createProjectSchema(schemaName: string): Promise<void> {
  assertValidIdentifier(schemaName, "nom de schéma");
  await pgPool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schemaName)}`);
}

export async function dropProjectSchema(schemaName: string): Promise<void> {
  assertValidIdentifier(schemaName, "nom de schéma");
  await pgPool.query(`DROP SCHEMA IF EXISTS ${quoteIdent(schemaName)} CASCADE`);
}

export async function listTables(schemaName: string): Promise<string[]> {
  const { rows } = await pgPool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
    [schemaName]
  );
  return rows.map((r) => r.table_name);
}

export async function getTableColumns(schemaName: string, tableName: string) {
  assertValidIdentifier(tableName, "nom de table");
  const { rows } = await pgPool.query(
    `SELECT
       c.column_name,
       c.data_type,
       c.is_nullable,
       c.column_default,
       EXISTS (
         SELECT 1 FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type = 'PRIMARY KEY'
           AND tc.table_schema = $1 AND tc.table_name = $2 AND kcu.column_name = c.column_name
       ) AS is_primary_key
     FROM information_schema.columns c
     WHERE c.table_schema = $1 AND c.table_name = $2
     ORDER BY c.ordinal_position`,
    [schemaName, tableName]
  );
  return rows;
}

function buildColumnSql(col: ColumnDef): string {
  const type = assertValidColumnType(col.type);
  let sql = `${quoteIdent(col.name)} ${type}`;
  if (col.primaryKey) sql += " PRIMARY KEY";
  if (col.notNull && !col.primaryKey) sql += " NOT NULL";
  if (col.unique && !col.primaryKey) sql += " UNIQUE";
  if (col.default !== undefined && col.default !== null && col.default !== "") {
    sql += ` DEFAULT ${col.default}`;
  }
  return sql;
}

export async function createTable(schemaName: string, tableName: string, columns: ColumnDef[]): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  if (!columns.length) {
    throw new AppError("Une table doit avoir au moins une colonne.", 400);
  }
  const hasPk = columns.some((c) => c.primaryKey);
  const colsSql = columns.map(buildColumnSql).join(", ");
  const pkClause = hasPk ? "" : `, id uuid PRIMARY KEY DEFAULT gen_random_uuid()`;
  const sql = `CREATE TABLE ${quoteQualified(schemaName, tableName)} (${colsSql}${pkClause})`;
  await pgPool.query(sql);
}

export async function dropTable(schemaName: string, tableName: string): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  await pgPool.query(`DROP TABLE IF EXISTS ${quoteQualified(schemaName, tableName)}`);
}

export async function renameTable(schemaName: string, tableName: string, newName: string): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  assertValidIdentifier(newName, "nouveau nom de table");
  await pgPool.query(
    `ALTER TABLE ${quoteQualified(schemaName, tableName)} RENAME TO ${quoteIdent(newName)}`
  );
}

export async function addColumn(schemaName: string, tableName: string, col: ColumnDef): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  const colSql = buildColumnSql(col);
  await pgPool.query(`ALTER TABLE ${quoteQualified(schemaName, tableName)} ADD COLUMN ${colSql}`);
}

export async function dropColumn(schemaName: string, tableName: string, columnName: string): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  assertValidIdentifier(columnName, "nom de colonne");
  await pgPool.query(
    `ALTER TABLE ${quoteQualified(schemaName, tableName)} DROP COLUMN ${quoteIdent(columnName)}`
  );
}

export async function renameColumn(schemaName: string, tableName: string, columnName: string, newName: string): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  assertValidIdentifier(columnName, "nom de colonne");
  assertValidIdentifier(newName, "nouveau nom de colonne");
  await pgPool.query(
    `ALTER TABLE ${quoteQualified(schemaName, tableName)} RENAME COLUMN ${quoteIdent(columnName)} TO ${quoteIdent(newName)}`
  );
}

export async function addForeignKey(
  schemaName: string,
  tableName: string,
  columnName: string,
  refTable: string,
  refColumn: string
): Promise<void> {
  assertValidIdentifier(tableName, "nom de table");
  assertValidIdentifier(columnName, "nom de colonne");
  assertValidIdentifier(refTable, "table référencée");
  assertValidIdentifier(refColumn, "colonne référencée");
  const constraintName = `fk_${tableName}_${columnName}`.slice(0, 63);
  await pgPool.query(
    `ALTER TABLE ${quoteQualified(schemaName, tableName)}
     ADD CONSTRAINT ${quoteIdent(constraintName)}
     FOREIGN KEY (${quoteIdent(columnName)})
     REFERENCES ${quoteQualified(schemaName, refTable)} (${quoteIdent(refColumn)})`
  );
}
