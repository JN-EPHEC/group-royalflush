import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma.js";

jest.mock("../config/swagger", () => ({
  swaggerSpec: {},
}));

jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../middleware/authJwt.js", () => ({
  authenticateTokenActive: (req: any, _res: any, next: any) => {
    req.userId = 7;
    next();
  },
}));

jest.mock("../lib/prisma.js", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock;
};

describe("Routes critiques blackjack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/blackjack/stake valide le montant", async () => {
    const res = await request(app).post("/api/blackjack/stake").send({ amount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Montant de mise invalide");
  });

  it("POST /api/blackjack/stake renvoie 400 si solde insuffisant", async () => {
    prismaMock.$transaction.mockRejectedValueOnce(new Error("INSUFFICIENT_FUNDS"));

    const res = await request(app).post("/api/blackjack/stake").send({ amount: 200 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Solde insuffisant");
  });

  it("POST /api/blackjack/stake débite et renvoie le nouveau solde", async () => {
    prismaMock.$transaction.mockResolvedValueOnce({ id: 7, balance: 850 });

    const res = await request(app).post("/api/blackjack/stake").send({ amount: 150 });

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(850);
  });

  it("POST /api/blackjack/save rejette un résultat invalide", async () => {
    const res = await request(app).post("/api/blackjack/save").send({
      bet: 50,
      result: "unknown",
      playerScore: 19,
      dealerScore: 17,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Résultat invalide");
  });

  it("POST /api/blackjack/save renvoie la balance finale", async () => {
    prismaMock.$transaction.mockResolvedValueOnce({ id: 7, balance: 1125 });

    const res = await request(app).post("/api/blackjack/save").send({
      bet: 100,
      result: "player-wins",
      playerScore: 20,
      dealerScore: 19,
      insuranceBet: 0,
      dealerHasBlackjack: false,
    });

    expect(res.status).toBe(201);
    expect(res.body.balance).toBe(1125);
  });
});
