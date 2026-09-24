import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { verifyJwt } from "../utils/jwt";

// Realtime minimal : les clients se connectent en ws://.../realtime?token=<jwt>&project=<id>
// et reçoivent les événements INSERT/UPDATE/DELETE des tables de ce projet, poussés par
// dispatchRealtimeEvent() (appelé depuis data.controller après chaque mutation).

interface Client {
  ws: WebSocket;
  projectId: string;
}

const clients = new Set<Client>();

export function initRealtimeServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/realtime" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");
    const projectId = url.searchParams.get("project");

    if (!token || !projectId) {
      ws.close(4001, "token et project requis");
      return;
    }
    try {
      verifyJwt(token);
    } catch {
      ws.close(4001, "token invalide");
      return;
    }

    const client: Client = { ws, projectId };
    clients.add(client);
    ws.send(JSON.stringify({ type: "connected", projectId }));

    ws.on("close", () => clients.delete(client));
  });

  return wss;
}

export function dispatchRealtimeEvent(projectId: string, table: string, type: "INSERT" | "UPDATE" | "DELETE", record: unknown) {
  const message = JSON.stringify({ type, table, record, projectId, at: new Date().toISOString() });
  for (const client of clients) {
    if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}
