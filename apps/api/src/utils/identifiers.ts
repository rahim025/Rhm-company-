import { AppError } from "./AppError";

// RÈGLE DE SÉCURITÉ CRITIQUE
// Les noms de table/colonne/schéma ne peuvent JAMAIS être passés en paramètre lié
// dans une requête SQL (Postgres ne le permet pas pour le DDL). On doit donc les
// injecter directement dans la requête. Pour empêcher toute injection SQL, on
// n'accepte QUE des identifiants qui matchent strictement ce pattern, et on les
// entoure toujours de guillemets doubles échappés.
const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

const RESERVED = new Set([
  "select", "insert", "update", "delete", "drop", "table", "from", "where",
  "user", "users", "grant", "revoke", "schema", "public", "pg_catalog",
]);

export function assertValidIdentifier(name: string, label = "identifiant"): string {
  if (typeof name !== "string" || !IDENTIFIER_PATTERN.test(name)) {
    throw new AppError(
      `${label} invalide: "${name}". Utilisez uniquement des lettres, chiffres et underscores, en commençant par une lettre ou underscore (max 63 caractères).`,
      400
    );
  }
  if (RESERVED.has(name.toLowerCase())) {
    throw new AppError(`${label} réservé: "${name}" ne peut pas être utilisé.`, 400);
  }
  return name;
}

// Entoure un identifiant validé de guillemets doubles pour l'injecter dans du SQL brut.
export function quoteIdent(name: string): string {
  assertValidIdentifier(name);
  return `"${name.replace(/"/g, '""')}"`;
}

export function quoteQualified(schema: string, table: string): string {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

const ALLOWED_COLUMN_TYPES = new Set([
  "text", "varchar", "integer", "bigint", "boolean", "timestamp", "timestamptz",
  "date", "uuid", "jsonb", "numeric", "real", "double precision", "serial", "bigserial",
]);

export function assertValidColumnType(type: string): string {
  const normalized = type.toLowerCase().trim();
  if (!ALLOWED_COLUMN_TYPES.has(normalized)) {
    throw new AppError(
      `Type de colonne non supporté: "${type}". Types autorisés: ${Array.from(ALLOWED_COLUMN_TYPES).join(", ")}.`,
      400
    );
  }
  return normalized;
}
