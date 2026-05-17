import { Router } from "express";
import { spinRoulette } from "../controllers/roulette.controller";
import { authenticateTokenActive } from "../middleware/authJwt.js";

const router = Router();

router.post("/spin", authenticateTokenActive, spinRoulette);

export default router;
