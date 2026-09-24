import crypto from "crypto";
import { prisma } from "../db/prisma";

// Déclenche les webhooks actifs correspondant à un événement (ex: "users.INSERT").
// Best-effort : les échecs sont journalisés dans WebhookDelivery avec retry simple.
export async function dispatchEvent(projectId: string, event: string, payload: unknown) {
  const webhooks = await prisma.webhook.findMany({ where: { projectId, event, isActive: true } });
  for (const webhook of webhooks) {
    void deliver(webhook.id, webhook.url, webhook.secret, payload, 1);
  }
}

async function deliver(webhookId: string, url: string, secret: string, payload: unknown, attempt: number) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-rhm-signature": signature },
      body,
    });
    await prisma.webhookDelivery.create({
      data: { webhookId, statusCode: response.status, success: response.ok, attempt, payload: payload as any },
    });
    if (!response.ok && attempt < 3) {
      setTimeout(() => void deliver(webhookId, url, secret, payload, attempt + 1), attempt * 2000);
    }
  } catch {
    await prisma.webhookDelivery.create({
      data: { webhookId, statusCode: 0, success: false, attempt, payload: payload as any },
    });
    if (attempt < 3) {
      setTimeout(() => void deliver(webhookId, url, secret, payload, attempt + 1), attempt * 2000);
    }
  }
}
