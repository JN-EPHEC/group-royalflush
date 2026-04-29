import { saveBlackjackGame, stakeBlackjack } from "../controllers/blackjack.controller";
import { prisma } from "../lib/prisma.js";

jest.mock("../lib/prisma.js", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock;
};

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("blackjack.controller (logique métier)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stakeBlackjack refuse si non authentifié", async () => {
    const req: any = { userId: undefined, body: { amount: 100 } };
    const res = mockRes();

    await stakeBlackjack(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("stakeBlackjack renvoie 404 si utilisateur introuvable", async () => {
    const req: any = { userId: 99, body: { amount: 100 } };
    const res = mockRes();
    prismaMock.$transaction.mockRejectedValueOnce(new Error("USER_NOT_FOUND"));

    await stakeBlackjack(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("saveBlackjackGame rejette une assurance trop élevée", async () => {
    const req: any = {
      userId: 7,
      body: {
        bet: 100,
        result: "player-wins",
        playerScore: 20,
        dealerScore: 18,
        insuranceBet: 60,
      },
    };
    const res = mockRes();

    await saveBlackjackGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Assurance trop élevée (max 50% de la mise)",
    });
  });

  it("saveBlackjackGame rejette des scores invalides", async () => {
    const req: any = {
      userId: 7,
      body: {
        bet: 100,
        result: "push",
        playerScore: "abc",
        dealerScore: 18,
      },
    };
    const res = mockRes();

    await saveBlackjackGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Scores invalides" });
  });

  it("saveBlackjackGame accepte un push et renvoie 201", async () => {
    const req: any = {
      userId: 7,
      body: {
        bet: 100,
        result: "push",
        playerScore: 19,
        dealerScore: 19,
        insuranceBet: 0,
        dealerHasBlackjack: false,
      },
    };
    const res = mockRes();
    prismaMock.$transaction.mockResolvedValueOnce({ id: 7, balance: 1000 });

    await saveBlackjackGame(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Partie enregistrée",
        balance: 1000,
      }),
    );
  });
});
