import { Router } from "express";
import User from "../models/User";
import * as userController from "../controllers/userControllers"
import { checkIdParams } from "../middlewares/checkIdParams";

const router = Router();


/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Récupère la liste des utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Succès
 */
router.get("/:id",checkIdParams, userController.getUserById)
router.get("/", userController.getAllUsers)

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: créer un utilisateur
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Succès
 */
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

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: modifier un user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: succès
 * 
 */

router.put("/:id", checkIdParams, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ message: "nom et prenom obligatoires" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    user.nom = nom;
    user.prenom = prenom;
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: supprimer un utilisateur
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Succès
 */
router.delete("/:id",checkIdParams, async (req, res) => {
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
