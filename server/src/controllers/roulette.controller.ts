import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

type BetType =
  | "plein" | "cheval" | "transversale" | "carre" | "sixain"
  | "colonne" | "douzaine"
  | "rouge" | "noir" | "pair" | "impair" | "manque" | "passe";

interface IncomingBet {
  type: BetType;
  value: string;
  amount: number;
}

const PAYOUTS: Record<BetType, number> = {
  plein: 35, cheval: 17, transversale: 11, carre: 8, sixain: 5,
  colonne: 2, douzaine: 2,
  rouge: 1, noir: 1, pair: 1, impair: 1, manque: 1, passe: 1,
};

const VALID_TYPES = new Set<string>(Object.keys(PAYOUTS));

function isWinning(bet: IncomingBet, n: number): boolean {
  switch (bet.type) {
    case "plein": return n === parseInt(bet.value, 10);
    case "cheval":
    case "transversale":
    case "carre":
    case "sixain":
      return bet.value.split("-").map(Number).includes(n);
    case "colonne": {
      if (n === 0) return false;
      const c = parseInt(bet.value, 10);
      if (c === 1) return n % 3 === 1;
      if (c === 2) return n % 3 === 2;
      if (c === 3) return n % 3 === 0;
      return false;
    }
    case "douzaine": {
      if (n === 0) return false;
      const d = parseInt(bet.value, 10);
      if (d === 1) return n >= 1 && n <= 12;
      if (d === 2) return n >= 13 && n <= 24;
      if (d === 3) return n >= 25 && n <= 36;
      return false;
    }
    case "rouge": return RED_NUMBERS.has(n);
    case "noir": return n !== 0 && !RED_NUMBERS.has(n);
    case "pair": return n !== 0 && n % 2 === 0;
    case "impair": return n % 2 === 1;
    case "manque": return n >= 1 && n <= 18;
    case "passe": return n >= 19 && n <= 36;
  }
}

function validateBet(b: unknown): b is IncomingBet {
  if (!b || typeof b !== "object") return false;
  const { type, value, amount } = b as Record<string, unknown>;
  if (!VALID_TYPES.has(type as string)) return false;
  if (typeof value !== "string" || value.trim().length === 0) return false;
  if (!Number.isFinite(amount as number) || (amount as number) <= 0) return false;
  return true;
}

export async function spinRoulette(req: Request, res: Response) {
  const userId = req.userId;
  if (userId == null) return res.status(401).json({ error: "Non authentifié" });

  const rawBets = (req.body ?? {}).bets;
  if (!Array.isArray(rawBets) || rawBets.length === 0) {
    return res.status(400).json({ error: "Aucune mise fournie" });
  }
  if (rawBets.length > 50) {
    return res.status(400).json({ error: "Trop de mises (max 50)" });
  }

  const bets: IncomingBet[] = [];
  for (const b of rawBets) {
    if (!validateBet(b)) return res.status(400).json({ error: "Mise invalide" });
    bets.push({ type: b.type as BetType, value: String(b.value).trim(), amount: Number(b.amount) });
  }

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);
  const winningNumber = Math.floor(Math.random() * 37); // 0–36

  const totalCredit = bets.reduce((s, b) => {
    if (isWinning(b, winningNumber)) {
      return s + b.amount * (PAYOUTS[b.type] + 1);
    }
    return s;
  }, 0);

  try {
    const finalUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true },
      });
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.balance < totalBet) throw new Error("INSUFFICIENT_FUNDS");

      const balanceAfterBet = user.balance - totalBet;

      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfterBet },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: totalBet,
          type: "ROULETTE_BET",
          balanceBefore: user.balance,
          balanceAfter: balanceAfterBet,
        },
      });

      for (const bet of bets) {
        const won = isWinning(bet, winningNumber);
        await tx.rouletteGame.create({
          data: {
            userId,
            betType: bet.type,
            betValue: bet.value,
            betAmount: bet.amount,
            winningNumber,
            result: won ? "win" : "lose",
          },
        });
      }

      if (totalCredit > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: totalCredit } },
        });
        await tx.transaction.create({
          data: {
            userId,
            amount: totalCredit,
            type: "ROULETTE_PAYOUT",
            balanceBefore: balanceAfterBet,
            balanceAfter: balanceAfterBet + totalCredit,
          },
        });
      }

      return await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true },
      });
    });

    const betResults = bets.map((b) => ({
      type: b.type,
      value: b.value,
      amount: b.amount,
      won: isWinning(b, winningNumber),
      payout: isWinning(b, winningNumber) ? b.amount * (PAYOUTS[b.type] + 1) : 0,
    }));

    return res.status(200).json({
      winningNumber,
      betResults,
      balance: finalUser?.balance ?? 0,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "USER_NOT_FOUND") return res.status(404).json({ error: "Utilisateur introuvable" });
      if (err.message === "INSUFFICIENT_FUNDS") return res.status(400).json({ error: "Solde insuffisant" });
    }
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
