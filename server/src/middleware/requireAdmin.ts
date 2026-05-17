import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (userId == null) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès administrateur requis" });
    }

    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
