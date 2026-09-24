import { PrismaClient } from "@prisma/client";

// Client Prisma unique (métadonnées de la plateforme: users, projects, api keys, logs)
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
