import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimit";
import { auditLogMiddleware } from "./middleware/auditLog";
import { errorHandler } from "./middleware/errorHandler";
import { initRealtimeServer } from "./services/realtime.service";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import dataRoutes from "./routes/data.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(globalRateLimiter);
app.use(auditLogMiddleware);

app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);

// IMPORTANT : dataRoutes (authentifié par clé API) doit être monté AVANT projectRoutes
// (authentifié par JWT) car son chemin est plus spécifique
// (/api/projects/:projectId/data/*) et doit être évalué en premier.
app.use("/api/projects/:projectId/data", dataRoutes);
app.use("/api/projects", projectRoutes);

app.use((req, res) => res.status(404).json({ error: "Route introuvable." }));
app.use(errorHandler);

const server = http.createServer(app);
initRealtimeServer(server);

server.listen(env.port, () => {
  console.log(`RHM Base API démarrée sur le port ${env.port} (${env.nodeEnv})`);
});
