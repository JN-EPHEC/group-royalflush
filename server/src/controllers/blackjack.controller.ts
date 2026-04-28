import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const FINISH_RESULTS = new Set([
  "player-blackjack",
  "player-bust",
  "dealer-bust",
  "player-wins",
  "dealer-wins",
  "push",
]);

/** Crédit à ajouter au solde après une main (la mise a déjà été débitée au stake). */
function payoutCredits(bet: number, result: string): number {
  if (result === "player-blackjack") {
    return bet + Math.floor(bet * 1.5);
  }
  if (result === "player-wins" || result === "dealer-bust") {
    return 2 * bet;
  }
  if (result === "push") {
    return bet;
  }
  return 0;
}

/** Débite la mise sur le compte joueur (appelé au début de la main). */
export async function stakeBlackjack(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (userId == null) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const amount = Number((req.body ?? {}).amount);
    const stakeKindRaw = String((req.body ?? {}).stakeKind ?? "MAIN_BET").toUpperCase();
    const stakeKind = stakeKindRaw === "INSURANCE_BET" ? "INSURANCE_BET" : "MAIN_BET";
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Montant de mise invalide" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }
      if (user.balance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: user.balance - amount },
        select: { id: true, balance: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: stakeKind === "INSURANCE_BET" ? "BLACKJACK_INSURANCE_BET" : "BLACKJACK_BET",
          balanceBefore: user.balance,
          balanceAfter: updatedUser.balance,
        },
      });

      return updatedUser;
    });

    return res.status(200).json({ balance: updated.balance });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({ error: "Solde insuffisant" });
      }
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "Utilisateur introuvable" });
      }
    }
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function saveBlackjackGame(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (userId == null) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { bet, result, playerScore, dealerScore, insuranceBet, dealerHasBlackjack } = req.body ?? {};

    const betAmount = Number(bet);
    const insuranceBetAmount = Number(insuranceBet ?? 0);
    const pScore = Math.trunc(Number(playerScore));
    const dScore = Math.trunc(Number(dealerScore));
    const resultStr = typeof result === "string" ? result.trim() : "";
    const dealerBJ = Boolean(dealerHasBlackjack);

    if (!Number.isFinite(betAmount) || betAmount <= 0) {
      return res.status(400).json({ error: "Mise invalide" });
    }
    if (!Number.isFinite(pScore) || !Number.isFinite(dScore)) {
      return res.status(400).json({ error: "Scores invalides" });
    }
    if (!FINISH_RESULTS.has(resultStr)) {
      return res.status(400).json({ error: "Résultat invalide" });
    }
    if (!Number.isFinite(insuranceBetAmount) || insuranceBetAmount < 0) {
      return res.status(400).json({ error: "Assurance invalide" });
    }
    if (insuranceBetAmount > betAmount / 2) {
      return res.status(400).json({ error: "Assurance trop élevée (max 50% de la mise)" });
    }

    const credit = payoutCredits(betAmount, resultStr);
    const insuranceCredit = dealerBJ && insuranceBetAmount > 0 ? insuranceBetAmount * 3 : 0;

    const finalUser = await prisma.$transaction(async (tx) => {
      const userBefore = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true },
      });
      if (!userBefore) {
        throw new Error("USER_NOT_FOUND");
      }

      await tx.blackjackGame.create({
        data: {
          userId,
          betAmount,
          playerScore: pScore,
          dealerScore: dScore,
          result: resultStr,
        },
      });

      if (credit > 0 || insuranceCredit > 0) {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: credit + insuranceCredit } },
          select: { id: true, balance: true },
        });

        if (credit > 0) {
          await tx.transaction.create({
            data: {
              userId,
              amount: credit,
              type: "BLACKJACK_PAYOUT",
              balanceBefore: userBefore.balance,
              balanceAfter: userBefore.balance + credit,
            },
          });
        }
        if (insuranceCredit > 0) {
          await tx.transaction.create({
            data: {
              userId,
              amount: insuranceCredit,
              type: "BLACKJACK_INSURANCE_PAYOUT",
              balanceBefore: userBefore.balance + credit,
              balanceAfter: updatedUser.balance,
            },
          });
        }

        return updatedUser;
      }

      return userBefore;
    });

    if (!finalUser) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    return res.status(201).json({
      message: "Partie enregistrée",
      balance: finalUser.balance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
