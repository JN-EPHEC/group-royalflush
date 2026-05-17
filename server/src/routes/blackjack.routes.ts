import { Router } from "express";
import { saveBlackjackGame, stakeBlackjack } from "../controllers/blackjack.controller";
import { authenticateTokenActive } from "../middleware/authJwt.js";

const router = Router();

router.post("/stake", authenticateTokenActive, stakeBlackjack);
router.post("/save", authenticateTokenActive, saveBlackjackGame);

export default router;