import { Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import { assertMember } from "./project.controller";
import { AppError } from "../utils/AppError";

const webhookBody = z.object({
  url: z.string().url(),
  event: z.string().min(1), // ex: "users.INSERT"
});

export const listWebhooks = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  const webhooks = await prisma.webhook.findMany({ where: { projectId: req.params.projectId } });
  res.json(webhooks.map(({ secret, ...w }) => w)); // le secret n'est jamais renvoyé après création
});

export const createWebhook = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const body = webhookBody.parse(req.body);
  const secret = crypto.randomBytes(24).toString("hex");
  const webhook = await prisma.webhook.create({
    data: { projectId: req.params.projectId, url: body.url, event: body.event, secret },
  });
  res.status(201).json({ ...webhook, warning: "Le secret ne sera plus affiché ensuite." });
});

export const deleteWebhook = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId, ["OWNER", "ADMIN"]);
  const webhook = await prisma.webhook.findUnique({ where: { id: req.params.webhookId } });
  if (!webhook || webhook.projectId !== req.params.projectId) throw new AppError("Webhook introuvable.", 404);
  await prisma.webhook.delete({ where: { id: webhook.id } });
  res.status(204).send();
});

export const listWebhookDeliveries = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertMember(req.userId!, req.params.projectId);
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId: req.params.webhookId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(deliveries);
});
