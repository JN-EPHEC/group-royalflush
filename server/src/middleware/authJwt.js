import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

/**
 * Vérifie Authorization: Bearer <token> et attache req.userId au payload JWT.
 */
export function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload.userId !== "number") {
      return res.status(403).json({ error: "Token invalide" });
    }
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(403).json({ error: "Session invalide ou expirée" });
  }
}

/**
 * Variante asynchrone : vérifie aussi le statut du compte en base.
 */
export async function authenticateTokenActive(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload.userId !== "number") {
      return res.status(403).json({ error: "Token invalide" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }
    if (user.status === "BLOCKED") {
      return res.status(403).json({ error: "Compte bloqué" });
    }

    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(403).json({ error: "Session invalide ou expirée" });
  }
}
