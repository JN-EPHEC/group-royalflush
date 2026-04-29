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
    req.userId = 1;
    next();
  },
}));

jest.mock("../middleware/requireAdmin", () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    blackjackGame: {
      findMany: jest.fn(),
    },
    rouletteGame: {
      findMany: jest.fn(),
    },
    adminActionLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  transaction: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  blackjackGame: {
    findMany: jest.Mock;
  };
  rouletteGame: {
    findMany: jest.Mock;
  };
  adminActionLog: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe("Routes critiques admin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/admin/users renvoie la liste des utilisateurs", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: 1, email: "admin@mail.com", role: "ADMIN", status: "ACTIVE", balance: 1000 },
    ]);

    const res = await request(app).get("/api/admin/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toBe("admin@mail.com");
  });

  it("PATCH /api/admin/users/:id/block rejette un id invalide", async () => {
    const res = await request(app).patch("/api/admin/users/not-a-number/block").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID utilisateur invalide");
  });

  it("GET /api/admin/transactions respecte la limite", async () => {
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      { id: 10, amount: 25, type: "ADMIN_DEPOSIT" },
    ]);

    const res = await request(app).get("/api/admin/transactions?limit=5");

    expect(res.status).toBe(200);
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
      }),
    );
  });

  it("PATCH /api/admin/users/:id/block refuse l'auto-blocage admin", async () => {
    const res = await request(app).patch("/api/admin/users/1/block").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Un admin ne peut pas se bloquer lui-même");
  });

  it("POST /api/admin/users/:id/withdraw valide le montant", async () => {
    const res = await request(app).post("/api/admin/users/2/withdraw").send({ amount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Montant invalide");
  });

  it("POST /api/admin/users/:id/deposit rejette un id invalide", async () => {
    const res = await request(app).post("/api/admin/users/nope/deposit").send({ amount: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID utilisateur invalide");
  });

  it("PATCH /api/admin/users/:id/promote promeut un utilisateur", async () => {
    prismaMock.user.update.mockResolvedValueOnce({
      id: 4,
      email: "u@mail.com",
      username: "u4",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const res = await request(app).patch("/api/admin/users/4/promote").send({});

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("ADMIN");
    expect(prismaMock.user.update).toHaveBeenCalled();
  });
});
