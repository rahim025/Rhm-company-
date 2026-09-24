import { Response } from "express";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema } from "../validators/auth.validators";
import { AuthedRequest } from "../middleware/auth";

export const register = asyncHandler(async (req, res: Response) => {
  const body = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new AppError("Un compte existe déjà avec cet email.", 409);

  const passwordHash = await hashPassword(body.password);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name,
      verifyToken,
      verifyTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // NOTE: l'envoi d'email réel (SMTP/Resend/SendGrid) est à brancher dans services/email.service.ts.
  // Pour le MVP, le lien de vérification est simplement retourné dans la réponse en dev.
  const token = signJwt({ userId: user.id });
  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
    devVerifyToken: process.env.NODE_ENV !== "production" ? verifyToken : undefined,
  });
});

export const login = asyncHandler(async (req, res: Response) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) throw new AppError("Email ou mot de passe incorrect.", 401);

  const valid = await verifyPassword(user.passwordHash, body.password);
  if (!valid) throw new AppError("Email ou mot de passe incorrect.", 401);

  const token = signJwt({ userId: user.id });
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError("Utilisateur introuvable.", 404);
  res.json({ id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified });
});

export const verifyEmail = asyncHandler(async (req, res: Response) => {
  const { token } = req.params;
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user || !user.verifyTokenExp || user.verifyTokenExp < new Date()) {
    throw new AppError("Lien de vérification invalide ou expiré.", 400);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null, verifyTokenExp: null },
  });
  res.json({ message: "Email vérifié avec succès." });
});

export const requestPasswordReset = asyncHandler(async (req, res: Response) => {
  const body = requestPasswordResetSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  // Réponse identique que l'utilisateur existe ou non, pour ne pas révéler les emails inscrits.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp: new Date(Date.now() + 60 * 60 * 1000) },
    });
  }
  res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
});

export const resetPassword = asyncHandler(async (req, res: Response) => {
  const body = resetPasswordSchema.parse(req.body);
  const user = await prisma.user.findFirst({ where: { resetToken: body.token } });
  if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
    throw new AppError("Lien de réinitialisation invalide ou expiré.", 400);
  }
  const passwordHash = await hashPassword(body.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExp: null },
  });
  res.json({ message: "Mot de passe réinitialisé avec succès." });
});

export const logout = asyncHandler(async (req, res: Response) => {
  // Le JWT est stateless : la déconnexion se fait côté client en supprimant le token.
  // (Pour une invalidation serveur, ajouter une liste noire de tokens ou passer à des sessions en base.)
  res.json({ message: "Déconnecté." });
});
