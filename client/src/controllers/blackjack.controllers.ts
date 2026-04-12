export const saveBlackjackGame = async (req, res) => {
  try {
    const { bet, result, playerHand, dealerHand, playerScore, dealerScore } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const { error } = await supabase.from("blackjack_games").insert({
      user_id: userId,
      bet,
      result,
      player_hand: playerHand,
      dealer_hand: dealerHand,
      player_score: playerScore,
      dealer_score: dealerScore,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ message: "Partie sauvegardée" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};