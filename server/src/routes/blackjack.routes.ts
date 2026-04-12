import { Router } from "express";
import { saveBlackjackGame, stakeBlackjack } from "../controllers/blackjack.controller";
import { authenticateToken } from "../middleware/authJwt.js";

const router = Router();

router.post("/stake", authenticateToken, stakeBlackjack);
router.post("/save", authenticateToken, saveBlackjackGame);

export default router;