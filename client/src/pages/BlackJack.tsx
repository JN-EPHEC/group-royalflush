import { useEffect, useState } from "react";
import "../styles/blackjack.css";
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
  | "playing"
  | "player-blackjack"
  | "player-bust"
  | "dealer-bust"
  | "player-wins"
  | "dealer-wins"
  | "push";

export default function Blackjack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [gameOver, setGameOver] = useState(false);

  const startNewGame = () => {
    let newDeck = shuffleDeck(createDeck());

    const firstPlayer = drawCard(newDeck);
    newDeck = firstPlayer.newDeck;

    const firstDealer = drawCard(newDeck);
    newDeck = firstDealer.newDeck;

    const secondPlayer = drawCard(newDeck);
    newDeck = secondPlayer.newDeck;

    const secondDealer = drawCard(newDeck);
    newDeck = secondDealer.newDeck;

    const newPlayerHand = [firstPlayer.card, secondPlayer.card];
    const newDealerHand = [firstDealer.card, secondDealer.card];

    setDeck(newDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameOver(false);

    const playerBJ = isBlackjack(newPlayerHand);
    const dealerBJ = isBlackjack(newDealerHand);

    if (playerBJ && dealerBJ) {
      setGameStatus("push");
      setGameOver(true);
    } else if (playerBJ) {
      setGameStatus("player-blackjack");
      setGameOver(true);
    } else if (dealerBJ) {
      setGameStatus("dealer-wins");
      setGameOver(true);
    } else {
      setGameStatus("playing");
    }
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleHit = () => {
    if (gameOver) return;

    const draw = drawCard(deck);
    const newPlayerHand = [...playerHand, draw.card];
    const newScore = calculateScore(newPlayerHand);

    setDeck(draw.newDeck);
    setPlayerHand(newPlayerHand);

    if (newScore > 21) {
      setGameStatus("player-bust");
      setGameOver(true);
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
    setGameOver(true);

    if (dealerScore > 21) {
      setGameStatus("dealer-bust");
    } else if (dealerScore > playerScore) {
      setGameStatus("dealer-wins");
    } else if (dealerScore < playerScore) {
      setGameStatus("player-wins");
    } else {
      setGameStatus("push");
    }
  };

  const getMessage = () => {
    switch (gameStatus) {
      case "player-blackjack":
        return "Blackjack ! Tu as gagné.";
      case "player-bust":
        return "Tu dépasses 21. Tu as perdu.";
      case "dealer-bust":
        return "Le croupier dépasse 21. Tu as gagné.";
      case "player-wins":
        return "Tu as gagné.";
      case "dealer-wins":
        return "Le croupier a gagné.";
      case "push":
        return "Égalité.";
      default:
        return "Partie en cours...";
    }
  };

  const playerScore = calculateScore(playerHand);
  const dealerScore = gameOver
    ? calculateScore(dealerHand)
    : getDealerVisibleScore(dealerHand);

  return (
    <div className="blackjack-page">
      <div className="blackjack-container">
        <h1>Blackjack</h1>

        <div className="game-message">{getMessage()}</div>

        <div className="table-section">
          <h2>Croupier</h2>
          <p>Score : {dealerScore}</p>
          <div className="cards-row">
            {dealerHand.map((card, index) => {
              const isHidden = !gameOver && index === 1;

              return (
                <div className={`card ${isHidden ? "hidden-card" : ""}`} key={`${card.suit}-${card.rank}-${index}`}>
                  {isHidden ? "?" : `${card.rank}${card.suit}`}
                </div>
              );
            })}
          </div>
        </div>

        <div className="table-section">
          <h2>Joueur</h2>
          <p>Score : {playerScore}</p>
          <div className="cards-row">
            {playerHand.map((card, index) => (
              <div className="card" key={`${card.suit}-${card.rank}-${index}`}>
                {card.rank}
                {card.suit}
              </div>
            ))}
          </div>
        </div>

        <div className="buttons-row">
          <button onClick={handleHit} disabled={gameOver}>
            Hit
          </button>
          <button onClick={handleStand} disabled={gameOver}>
            Stand
          </button>
          <button onClick={startNewGame}>New Game</button>
        </div>
      </div>
    </div>
  );
}