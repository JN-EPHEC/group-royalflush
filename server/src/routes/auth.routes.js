import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { authenticateToken, JWT_SECRET } from "../middleware/authJwt.js";

const router = express.Router();

const MIN_PASSWORD_LENGTH = 6;

/** Pseudo affiché si ancien compte sans username en base */
function displayUsername(user) {
  if (user.username && String(user.username).trim()) {
    return String(user.username).trim();
  }
  const email = user.email || "";
  const local = email.split("@")[0];
  return local || "Joueur";
}
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 24;

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/** Pseudo affiché en jeu : lettres, chiffres, tiret, underscore */
function isValidUsername(username) {
  const u = String(username).trim();
  if (u.length < MIN_USERNAME_LENGTH || u.length > MAX_USERNAME_LENGTH) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(u);
}

function validateRegisterBody(body) {
  const email = body?.email;
  const password = body?.password;
  const username = body?.username;
  if (!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(username)) {
    return { ok: false, error: "Tous les champs sont obligatoires" };
  }
  const u = String(username).trim();
  if (!isValidUsername(u)) {
    return {
      ok: false,
      error: `Pseudo : ${MIN_USERNAME_LENGTH} à ${MAX_USERNAME_LENGTH} caractères (lettres, chiffres, - et _ uniquement)`,
    };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Adresse e-mail invalide" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
    };
  }
  return { ok: true, email: email.trim(), password, username: u };
}

function validateLoginBody(body) {
  const email = body?.email;
  const password = body?.password;
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return { ok: false, error: "Tous les champs sont obligatoires" };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Adresse e-mail invalide" };
  }
  return { ok: true, email: email.trim(), password };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const parsed = validateRegisterBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const { email, password, username } = parsed;

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingEmail) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
    if (existingUsername) {
      return res.status(409).json({ error: "Ce pseudo est déjà pris" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        balance: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: "Compte créé", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// LOGIN — même message si email inconnu ou mot de passe faux (pas d'énumération)
router.post("/login", async (req, res) => {
  try {
    const parsed = validateLoginBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const { email, password } = parsed;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: displayUsername(user),
        balance: user.balance,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Profil connecté uniquement (données Prisma / auth)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        balance: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    res.json({
      ...user,
      username: displayUsername(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
