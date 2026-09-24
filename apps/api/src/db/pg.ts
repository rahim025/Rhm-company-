import { Pool } from "pg";
import { env } from "../config/env";

// Pool pg brut utilisé pour exécuter du DDL/DML dynamique dans les schémas
// des projets utilisateurs (Database Studio, API REST auto-générée, SQL editor).
// On n'utilise PAS Prisma ici car le schéma des tables utilisateur est inconnu à l'avance.
export const pgPool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
});

pgPool.on("error", (err) => {
  console.error("Erreur inattendue sur le pool pg", err);
});
