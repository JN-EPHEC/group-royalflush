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
  JWT_SECRET: "TEST_SECRET",
  authenticateTokenActive: (req: any, _res: any, next: any) => {
    req.userId = 7;
    next();
  },
}));

jest.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

describe("Routes critiques auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /register crée un compte", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 7,
      email: "test@mail.com",
      username: "test_user",
      balance: 1000,
      createdAt: new Date().toISOString(),
    });

    const res = await request(app).post("/register").send({
      email: "test@mail.com",
      username: "test_user",
      password: "Abcd1234!",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("test@mail.com");
  });

  it("POST /login renvoie une erreur générique si user absent", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post("/login").send({
      email: "missing@mail.com",
      password: "whatever123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Email ou mot de passe incorrect");
  });

  it("POST /register rejette les champs manquants", async () => {
    const res = await request(app).post("/register").send({
      email: "",
      username: "",
      password: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Tous les champs sont obligatoires");
  });

  it("POST /register refuse un email déjà utilisé", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);

    const res = await request(app).post("/register").send({
      email: "taken@mail.com",
      username: "new_user",
      password: "Abcd1234!",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email déjà utilisé");
  });

  it("POST /login renvoie 401 si mot de passe incorrect", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: "x@mail.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
      status: "ACTIVE",
      role: "USER",
      balance: 1000,
      username: "x",
    });

    const res = await request(app).post("/login").send({
      email: "x@mail.com",
      password: "badpass",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Email ou mot de passe incorrect");
  });

  it("GET /me retourne 404 si utilisateur introuvable", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/me").set("Authorization", "Bearer fake");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Utilisateur introuvable");
  });

  it("GET /me retourne le profil connecté", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 7,
      email: "me@mail.com",
      username: "me_user",
      role: "USER",
      status: "ACTIVE",
      balance: 250,
      createdAt: new Date().toISOString(),
    });

    const res = await request(app).get("/me").set("Authorization", "Bearer fake");

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@mail.com");
    expect(res.body.username).toBe("me_user");
  });
});
