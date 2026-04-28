import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateTokenActive } from "../middleware/authJwt.js";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(authenticateTokenActive, requireAdmin);

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        balance: true,
        createdAt: true,
      },
      orderBy: { id: "desc" },
    });

    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/:id/transactions", async (req, res) => {
  try {
    const targetUserId = parseId(req.params.id);
    if (targetUserId == null) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/users/:id/games", async (req, res) => {
  try {
    const targetUserId = parseId(req.params.id);
    if (targetUserId == null) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const [blackjackGames, rouletteGames] = await Promise.all([
      prisma.blackjackGame.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rouletteGame.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.status(200).json({ blackjackGames, rouletteGames });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/users/:id/block", async (req, res) => {
  try {
    const adminId = req.userId;
    const targetUserId = parseId(req.params.id);
    if (adminId == null) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    if (targetUserId == null) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }
    if (adminId === targetUserId) {
      return res.status(400).json({ error: "Un admin ne peut pas se bloquer lui-même" });
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true, status: true } });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const blockedUser = await tx.user.update({
        where: { id: targetUserId },
        data: { status: "BLOCKED" },
        select: { id: true, email: true, username: true, status: true },
      });

      await tx.adminActionLog.create({
        data: {
          adminId,
          targetUserId,
          actionType: "BLOCK_USER",
          reason,
        },
      });

      return blockedUser;
    });

    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/users/:id/unblock", async (req, res) => {
  try {
    const adminId = req.userId;
    const targetUserId = parseId(req.params.id);
    if (adminId == null) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    if (targetUserId == null) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true, status: true } });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const activeUser = await tx.user.update({
        where: { id: targetUserId },
        data: { status: "ACTIVE" },
        select: { id: true, email: true, username: true, status: true },
      });

      await tx.adminActionLog.create({
        data: {
          adminId,
          targetUserId,
          actionType: "UNBLOCK_USER",
          reason,
        },
      });

      return activeUser;
    });

    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/:id/withdraw", async (req, res) => {
  try {
    const adminId = req.userId;
    const targetUserId = parseId(req.params.id);
    if (adminId == null) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    if (targetUserId == null) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, balance: true },
      });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }
      if (user.balance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: { balance: { decrement: amount } },
        select: { id: true, email: true, username: true, balance: true },
      });

      await tx.transaction.create({
        data: {
          userId: targetUserId,
          amount,
          type: "ADMIN_WITHDRAW",
          balanceBefore: user.balance,
          balanceAfter: user.balance - amount,
        },
      });

      await tx.adminActionLog.create({
        data: {
          adminId,
          targetUserId,
          actionType: "WITHDRAW_FUNDS",
          amount,
          reason,
        },
      });

      return updatedUser;
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "Utilisateur introuvable" });
      }
      if (err.message === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({ error: "Solde insuffisant" });
      }
    }
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/users/:id/promote", async (req, res) => {
  try {
    const adminId = req.userId;
    const targetUserId = parseId(req.params.id);
    if (adminId == null) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    if (targetUserId == null) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: "ADMIN",
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
