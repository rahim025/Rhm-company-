import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Authentification requise.", 401));
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyJwt(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(new AppError("Token invalide ou expiré.", 401));
  }
}
