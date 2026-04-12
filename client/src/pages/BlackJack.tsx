import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayingCard from "../components/PlayingCard";
import "../styles/blackjack.css";
import { updateStoredUserBalance } from "../lib/authStorage";
import {
  type Card,
  calculateScore,
  createDeck,
  drawCard,
  getDealerVisibleScore,
  isBlackjack,
  shuffleDeck,
} from "../utils/blackjack";

type GameStatus =
  | "idle"
  | "playing"
  | "player-blackjack"
  | "player-bust"
  | "dealer-bust"
  | "player-wins"
  | "dealer-wins"
  | "push";

const API = "http://localhost:3000";

export default function Blackjack() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [gameOver, setGameOver] = useState(true);

  const [chips, setChips] = useState(0);
  const [bet, setBet] = useState(50);
  /** Mise engagée pour la main en cours (évite les valeurs périmées si `bet` change). */
  const [handWager, setHandWager] = useState(0);
  const [staking, setStaking] = useState(false);

  const applyServerBalance = (balance: number) => {
    setChips(balance);
    updateStoredUserBalance(balance);
  };

  const getMessage = () => {
    switch (gameStatus) {
      case "idle":
        return "Règle ta mise, puis clique sur « Miser et jouer » : les jetons sont prélevés tout de suite.";
      case "playing":
        return "Partie en cours...";
      case "player-blackjack":
        return "Blackjack ! Tu gagnes.";
      case "player-bust":
        return "Tu dépasses 21. Tu perds.";
      case "dealer-bust":
        return "Le croupier dépasse 21. Tu gagnes.";
      case "player-wins":
        return "Tu gagnes.";
      case "dealer-wins":
        return "Le croupier gagne.";
      case "push":
        return "Égalité.";
      default:
        return "";
    }
  };

  const saveGameToDatabase = async (
    result: GameStatus,
    finalPlayerHand: Card[],
    finalDealerHand: Card[],
    finalPlayerScore: number,
    finalDealerScore: number,
    wager: number
  ): Promise<number | null> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const data = {
        bet: wager,
        result,
        playerHand: finalPlayerHand,
        dealerHand: finalDealerHand,
        playerScore: finalPlayerScore,
        dealerScore: finalDealerScore,
      };

      const res = await fetch(`${API}/api/blackjack/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = (await res.json().catch(() => ({}))) as { balance?: number };
      if (!res.ok) return null;
      return typeof json.balance === "number" ? json.balance : null;
    } catch (error) {
      console.error("Erreur sauvegarde blackjack :", error);
      return null;
    }
  };

  const finishGame = async (
    result: GameStatus,
    finalPlayerHand: Card[],
    finalDealerHand: Card[],
    wager: number
  ) => {
    const finalPlayerScore = calculateScore(finalPlayerHand);
    const finalDealerScore = calculateScore(finalDealerHand);

    setGameStatus(result);
    setGameOver(true);

    const newBalance = await saveGameToDatabase(
      result,
      finalPlayerHand,
      finalDealerHand,
      finalPlayerScore,
      finalDealerScore,
      wager
    );
    if (newBalance !== null) {
      applyServerBalance(newBalance);
    } else {
      alert(
        "La partie n’a pas pu être enregistrée côté serveur. Rafraîchis la page pour voir ton solde réel."
      );
    }
  };

  /** Mise débitée sur le compte (API), puis distribution. */
  const placeBetAndDeal = async () => {
    if (!gameOver || staking) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Connecte-toi pour jouer : ton solde est sur ton compte.");
      return;
    }

    if (bet <= 0) {
      alert("La mise doit être supérieure à 0.");
      return;
    }

    if (bet > chips) {
      alert("Tu n'as pas assez de jetons.");
      return;
    }

    const wager = bet;
    setStaking(true);
    try {
      const res = await fetch(`${API}/api/blackjack/stake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: wager }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; balance?: number };
      if (!res.ok) {
        alert(json.error ?? "Impossible de miser.");
        return;
      }
      if (typeof json.balance !== "number") {
        alert("Réponse serveur invalide.");
        return;
      }
      applyServerBalance(json.balance);
      setHandWager(wager);
    } finally {
      setStaking(false);
    }

    let newDeck = shuffleDeck(createDeck());

    const p1 = drawCard(newDeck);
    newDeck = p1.newDeck;

    const d1 = drawCard(newDeck);
    newDeck = d1.newDeck;

    const p2 = drawCard(newDeck);
    newDeck = p2.newDeck;

    const d2 = drawCard(newDeck);
    newDeck = d2.newDeck;

    const newPlayerHand = [p1.card, p2.card];
    const newDealerHand = [d1.card, d2.card];

    setDeck(newDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameOver(false);

    const playerBJ = isBlackjack(newPlayerHand);
    const dealerBJ = isBlackjack(newDealerHand);

    if (playerBJ && dealerBJ) {
      finishGame("push", newPlayerHand, newDealerHand, wager);
    } else if (playerBJ) {
      finishGame("player-blackjack", newPlayerHand, newDealerHand, wager);
    } else if (dealerBJ) {
      finishGame("dealer-wins", newPlayerHand, newDealerHand, wager);
    } else {
      setGameStatus("playing");
    }
  };

  const handleHit = () => {
    if (gameOver) return;

    const draw = drawCard(deck);
    const newPlayerHand = [...playerHand, draw.card];
    const score = calculateScore(newPlayerHand);

    setDeck(draw.newDeck);
    setPlayerHand(newPlayerHand);

    if (score > 21) {
      finishGame("player-bust", newPlayerHand, dealerHand, handWager);
    }
  };

  const handleStand = () => {
    if (gameOver) return;

    let currentDeck = [...deck];
    let currentDealerHand = [...dealerHand];

    while (calculateScore(currentDealerHand) < 17) {
      const draw = drawCard(currentDeck);
      currentDealerHand = [...currentDealerHand, draw.card];
      currentDeck = draw.newDeck;
    }

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(currentDealerHand);

    setDeck(currentDeck);
    setDealerHand(currentDealerHand);

    if (dealerScore > 21) {
      finishGame("dealer-bust", playerHand, currentDealerHand, handWager);
    } else if (dealerScore > playerScore) {
      finishGame("dealer-wins", playerHand, currentDealerHand, handWager);
    } else if (dealerScore < playerScore) {
      finishGame("player-wins", playerHand, currentDealerHand, handWager);
    } else {
      finishGame("push", playerHand, currentDealerHand, handWager);
    }
  };

  useEffect(() => {
    setGameStatus("idle");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setChips(0);
      return;
    }
    fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((u: { balance?: number } | null) => {
        if (u && typeof u.balance === "number") {
          applyServerBalance(u.balance);
        }
      })
      .catch(() => {});
  }, []);

  const playerScore = calculateScore(playerHand);
  const dealerScore = gameOver
    ? calculateScore(dealerHand)
    : getDealerVisibleScore(dealerHand);

  const handleQuit = () => {
    if (!gameOver) {
      const ok = window.confirm(
        "Abandonner la main en cours ? Ta mise reste perdue (aucun remboursement)."
      );
      if (!ok) return;
    }
    navigate("/jeu");
  };

  return (
    <div className="blackjack-page">
      <div className="blackjack-table">
        <div className="table-topbar">
          <button type="button" className="blackjack-quit-btn" onClick={handleQuit}>
            Quitter
          </button>
          <div className="table-topbar-main">
            <div className="info-box">
              <span>Jetons</span>
              <strong>{Math.round(chips)}</strong>
            </div>

            <div className="info-box">
              <span>Mise</span>
              <strong>{bet}</strong>
            </div>

            <div className="bet-controls">
              <button
                type="button"
                disabled={!gameOver}
                onClick={() => setBet((prev) => Math.max(10, prev - 10))}
              >
                -10
              </button>
              <button type="button" disabled={!gameOver} onClick={() => setBet((prev) => prev + 10)}>
                +10
              </button>
              <button type="button" disabled={!gameOver} onClick={() => setBet((prev) => prev + 50)}>
                +50
              </button>
            </div>
          </div>
        </div>

        <h1>Blackjack</h1>
        <p className="game-message">{getMessage()}</p>

        <div className="hand-section">
          <div className="hand-header">
            <h2>Croupier</h2>
            <span>Score : {dealerScore}</span>
          </div>

          <div className="cards-row">
            {dealerHand.map((card, index) => (
              <PlayingCard
                key={`${card.suit}-${card.rank}-${index}`}
                card={card}
                hidden={!gameOver && index === 1}
              />
            ))}
          </div>
        </div>

        <div className="hand-section">
          <div className="hand-header">
            <h2>Joueur</h2>
            <span>Score : {playerScore}</span>
          </div>

          <div className="cards-row">
            {playerHand.map((card, index) => (
              <PlayingCard key={`${card.suit}-${card.rank}-${index}`} card={card} />
            ))}
          </div>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="primary-btn"
            onClick={() => void placeBetAndDeal()}
            disabled={!gameOver || staking || bet <= 0 || bet > chips}
          >
            {staking ? "Mise…" : "Miser et jouer"}
          </button>
          <button className="secondary-btn" onClick={handleHit} disabled={gameOver}>
            Hit
          </button>
          <button className="secondary-btn" onClick={handleStand} disabled={gameOver}>
            Stand
          </button>
        </div>
      </div>
    </div>
  );
}