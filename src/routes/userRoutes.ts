import { Router } from "express";
import User from "../models/User";
import * as userController from "../controllers/userControllers"

const router = Router();

router.get("/", userController.getAllUsers)
// GET /api/users


// POST /api/users
router.post("/", async (req, res) => {
  try {
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ message: "nom et prenom obligatoires" });
    }

    const created = await User.create({ nom, prenom });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id invalide" });
    }

    const deletedCount = await User.destroy({ where: { id } });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
