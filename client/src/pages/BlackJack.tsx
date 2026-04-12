import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayingCard from "../components/PlayingCard";
import "../styles/blackjack.css";
import { updateStoredUserBalance } from "../lib/authStorage";
import {
  type Card,
  calculateScore,
  canSplitPair,
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

type PendingHandSettlement = {
  cards: Card[];
  wager: number;
  busted: boolean;
};

const API = "http://localhost:3000";
/** Nombre max de mains (re-splits inclus), règle type casino. */
const MAX_PLAYER_HANDS = 4;

export default function Blackjack() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerHands, setPlayerHands] = useState<Card[][]>([]);
  const [handBets, setHandBets] = useState<number[]>([]);
  const [handDoubled, setHandDoubled] = useState<boolean[]>([]);
  const [handDone, setHandDone] = useState<boolean[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [gameOver, setGameOver] = useState(true);
  const [endSummary, setEndSummary] = useState<string | null>(null);

  const [chips, setChips] = useState(0);
  const [bet, setBet] = useState(10);
  const [staking, setStaking] = useState(false);

  const deckRef = useRef(deck);

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  const applyServerBalance = (balance: number) => {
    setChips(balance);
    updateStoredUserBalance(balance);
  };

  const stakeAmount = async (amount: number): Promise<number | null> => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const res = await fetch(`${API}/api/blackjack/stake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    const json = (await res.json().catch(() => ({}))) as { balance?: number; error?: string };
    if (!res.ok) {
      alert(json.error ?? "Impossible de miser.");
      return null;
    }
    if (typeof json.balance !== "number") return null;
    return json.balance;
  };

  const getMessage = () => {
    if (endSummary) return endSummary;
    switch (gameStatus) {
      case "idle":
        return `Le blackjack est un jeu de cartes où le but est d’obtenir un total de points le plus proche possible de 21 sans le dépasser, en battant le croupier.`;
      case "playing":
        if (playerHands.length > 1) {
          return `Main ${activeHandIndex + 1} / ${playerHands.length}`;
        }
        return "Partie en cours…";
      case "player-blackjack":
        return "Blackjack naturel ! Tu gagnes (3:2).";
      case "player-bust":
        return "Tu dépasses 21.";
      case "dealer-bust":
        return "Le croupier dépasse 21.";
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

  const finishNaturalRound = async (
    result: GameStatus,
    pHand: Card[],
    dHand: Card[],
    wager: number
  ) => {
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    setGameStatus(result);
    setGameOver(true);
    setEndSummary(null);

    const newBalance = await saveGameToDatabase(result, pHand, dHand, pScore, dScore, wager);
    if (newBalance !== null) {
      applyServerBalance(newBalance);
    } else {
      alert(
        "La partie n’a pas pu être enregistrée côté serveur. Rafraîchis la page pour voir ton solde réel."
      );
    }
  };

  const describeOutcome = (result: GameStatus, handIdx: number): string => {
    const label = `M${handIdx + 1}`;
    switch (result) {
      case "player-bust":
        return `${label} : bust`;
      case "dealer-bust":
        return `${label} : gagné (croupier bust)`;
      case "player-wins":
        return `${label} : gagné`;
      case "dealer-wins":
        return `${label} : perdu`;
      case "push":
        return `${label} : égalité`;
      default:
        return `${label} : fin`;
    }
  };

  const finalizeMultiHandRound = async (
    pending: PendingHandSettlement[],
    dHand: Card[],
    dk: Card[]
  ) => {
    let d = [...dHand];
    let deckLocal = [...dk];
    while (calculateScore(d) < 17) {
      const draw = drawCard(deckLocal);
      d.push(draw.card);
      deckLocal = draw.newDeck;
    }

    const dScore = calculateScore(d);
    const dealerBust = dScore > 21;

    setDeck(deckLocal);
    setDealerHand(d);
    setGameOver(true);

    const parts: string[] = [];
    let lastBalance: number | null = null;

    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      let result: GameStatus;
      if (p.busted) {
        result = "player-bust";
      } else if (dealerBust) {
        result = "dealer-bust";
      } else {
        const pScore = calculateScore(p.cards);
        if (pScore > dScore) result = "player-wins";
        else if (pScore < dScore) result = "dealer-wins";
        else result = "push";
      }
      parts.push(describeOutcome(result, i));
      const bal = await saveGameToDatabase(
        result,
        p.cards,
        d,
        calculateScore(p.cards),
        dScore,
        p.wager
      );
      if (bal !== null) lastBalance = bal;
    }

    setEndSummary(parts.join(" · "));
    setGameStatus("playing");
    if (lastBalance !== null) applyServerBalance(lastBalance);
    else if (pending.length > 0) {
      alert(
        "Une ou plusieurs mains n’ont pas pu être enregistrées. Rafraîchis la page pour ton solde."
      );
    }
  };

  const findNextActive = (done: boolean[], from: number): number => {
    for (let i = from + 1; i < done.length; i++) {
      if (!done[i]) return i;
    }
    return -1;
  };

  const findFirstIncompleteHand = (done: boolean[]): number => done.findIndex((d) => !d);

  /** Quand toutes les mains sont terminées, file de règlement dans l’ordre des mains (M1, M2…). */
  const completeCurrentHand = (
    nextDone: boolean[],
    currentActive: number,
    nextDeck: Card[],
    handsAfter: Card[][],
    betsAfter: number[]
  ) => {
    setPlayerHands(handsAfter);
    setHandBets(betsAfter);
    setHandDone(nextDone);
    setDeck(nextDeck);

    const nextIdx = findNextActive(nextDone, currentActive);
    if (nextIdx >= 0) {
      setActiveHandIndex(nextIdx);
    } else {
      const queue: PendingHandSettlement[] = handsAfter.map((cards, idx) => ({
        cards,
        wager: betsAfter[idx],
        busted: calculateScore(cards) > 21,
      }));
      void finalizeMultiHandRound(queue, dealerHand, nextDeck);
    }
  };

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
      const balance = await stakeAmount(wager);
      if (balance === null) return;
      applyServerBalance(balance);
    } finally {
      setStaking(false);
    }

    setEndSummary(null);

    let newDeck = shuffleDeck(createDeck());

    const p1 = drawCard(newDeck);
    newDeck = p1.newDeck;

    const d1 = drawCard(newDeck);
    newDeck = d1.newDeck;

    const p2 = drawCard(newDeck);
    newDeck = p2.newDeck;

    const d2 = drawCard(newDeck);
    newDeck = d2.newDeck;

    const firstHand = [p1.card, p2.card];
    const newDealerHand = [d1.card, d2.card];

    setDeck(newDeck);
    setDealerHand(newDealerHand);
    setPlayerHands([firstHand]);
    setHandBets([wager]);
    setHandDoubled([false]);
    setHandDone([false]);
    setActiveHandIndex(0);
    setGameOver(false);

    const playerBJ = isBlackjack(firstHand);
    const dealerBJ = isBlackjack(newDealerHand);

    if (playerBJ && dealerBJ) {
      await finishNaturalRound("push", firstHand, newDealerHand, wager);
    } else if (playerBJ) {
      await finishNaturalRound("player-blackjack", firstHand, newDealerHand, wager);
    } else if (dealerBJ) {
      await finishNaturalRound("dealer-wins", firstHand, newDealerHand, wager);
    } else {
      setGameStatus("playing");
    }
  };

  const handleHit = () => {
    if (gameOver) return;
    const i = activeHandIndex;
    if (!playerHands[i] || handDone[i]) return;

    const draw = drawCard(deck);
    const newHand = [...playerHands[i], draw.card];
    const score = calculateScore(newHand);
    const nextHands = playerHands.map((h, idx) => (idx === i ? newHand : h));

    if (score > 21) {
      const nextDone = handDone.map((d, idx) => (idx === i ? true : d));
      completeCurrentHand(nextDone, i, draw.newDeck, nextHands, handBets);
    } else {
      setDeck(draw.newDeck);
      setPlayerHands(nextHands);
    }
  };

  const handleStand = () => {
    if (gameOver) return;
    const i = activeHandIndex;
    if (!playerHands[i] || handDone[i]) return;

    const nextDone = handDone.map((d, idx) => (idx === i ? true : d));
    const handsAfter = playerHands.map((h, idx) => (idx === i ? [...h] : h));
    completeCurrentHand(nextDone, i, deck, handsAfter, handBets);
  };

  const handleDouble = async () => {
    if (gameOver) return;
    const i = activeHandIndex;
    const h = playerHands[i];
    if (!h || handDone[i] || h.length !== 2 || handDoubled[i]) return;

    const extra = handBets[i];
    if (extra > chips) {
      alert("Solde insuffisant pour doubler.");
      return;
    }

    setStaking(true);
    const bal = await stakeAmount(extra);
    setStaking(false);
    if (bal === null) return;
    applyServerBalance(bal);

    const newBetRow = handBets.map((b, idx) => (idx === i ? b + extra : b));
    const newDoubled = handDoubled.map((d, idx) => (idx === i ? true : d));
    setHandBets(newBetRow);
    setHandDoubled(newDoubled);

    const draw = drawCard(deckRef.current);
    const newHand = [...h, draw.card];
    const score = calculateScore(newHand);
    const nextHands = playerHands.map((row, idx) => (idx === i ? newHand : row));
    setDeck(draw.newDeck);
    setPlayerHands(nextHands);

    const nextDone = handDone.map((d, idx) => (idx === i ? true : d));
    completeCurrentHand(nextDone, i, draw.newDeck, nextHands, newBetRow);
  };

  const handleSplit = async () => {
    if (gameOver) return;
    const i = activeHandIndex;
    const h = playerHands[i];
    if (!h || h.length !== 2 || !canSplitPair(h[0], h[1])) return;
    if (handDone[i]) return;
    if (playerHands.length >= MAX_PLAYER_HANDS) {
      alert(`Maximum ${MAX_PLAYER_HANDS} mains (re-split limité).`);
      return;
    }

    const pairIsAces = h[0].rank === "A" && h[1].rank === "A";
    const extra = handBets[i];
    if (extra > chips) {
      alert("Solde insuffisant pour splitter.");
      return;
    }

    setStaking(true);
    const bal = await stakeAmount(extra);
    setStaking(false);
    if (bal === null) return;
    applyServerBalance(bal);

    let dk = [...deckRef.current];
    const draw1 = drawCard(dk);
    dk = draw1.newDeck;
    const draw2 = drawCard(dk);
    dk = draw2.newDeck;

    const handA: Card[] = [h[0], draw1.card];
    const handB: Card[] = [h[1], draw2.card];

    const newHands = [...playerHands.slice(0, i), handA, handB, ...playerHands.slice(i + 1)];
    const newBets = [...handBets.slice(0, i), extra, extra, ...handBets.slice(i + 1)];
    const newDoubled = [...handDoubled.slice(0, i), false, false, ...handDoubled.slice(i + 1)];

    if (pairIsAces) {
      const newDone = [...handDone.slice(0, i), true, true, ...handDone.slice(i + 1)];
      setDeck(dk);
      setPlayerHands(newHands);
      setHandBets(newBets);
      setHandDoubled(newDoubled);
      setHandDone(newDone);

      if (newDone.every(Boolean)) {
        const queue: PendingHandSettlement[] = newHands.map((cards, idx) => ({
          cards,
          wager: newBets[idx],
          busted: calculateScore(cards) > 21,
        }));
        void finalizeMultiHandRound(queue, dealerHand, dk);
      } else {
        const next = findFirstIncompleteHand(newDone);
        setActiveHandIndex(next >= 0 ? next : 0);
      }
      return;
    }

    const newDone = [...handDone.slice(0, i), false, false, ...handDone.slice(i + 1)];
    setDeck(dk);
    setPlayerHands(newHands);
    setHandBets(newBets);
    setHandDoubled(newDoubled);
    setHandDone(newDone);
    setActiveHandIndex(i);
  };

  const handleQuit = () => {
    if (!gameOver) {
      const ok = window.confirm(
        "Abandonner la main en cours ? Ta mise reste perdue (aucun remboursement)."
      );
      if (!ok) return;
    }
    navigate("/jeu");
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

  const dealerScore = gameOver
    ? calculateScore(dealerHand)
    : getDealerVisibleScore(dealerHand);

  const currentHand = playerHands[activeHandIndex];

  const canDouble =
    !gameOver &&
    currentHand &&
    currentHand.length === 2 &&
    !handDoubled[activeHandIndex] &&
    !handDone[activeHandIndex];

  const canSplit =
    !gameOver &&
    playerHands.length < MAX_PLAYER_HANDS &&
    currentHand?.length === 2 &&
    canSplitPair(currentHand[0], currentHand[1]) &&
    !handDone[activeHandIndex];

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

        <div className="player-hands-stack">
          {playerHands.map((hand, hi) => (
            <div
              key={hi}
              className={`hand-section player-hand-block ${hi === activeHandIndex && !gameOver ? "player-hand-block--active" : ""}`}
            >
              <div className="hand-header">
                <h2>{playerHands.length > 1 ? `Joueur — main ${hi + 1}` : "Joueur"}</h2>
                <span>
                  Score : {calculateScore(hand)} · Mise : {handBets[hi] ?? 0}
                  {handDoubled[hi] ? " (doublée)" : ""}
                </span>
              </div>

              <div className="cards-row">
                {hand.map((card, index) => (
                  <PlayingCard key={`${hi}-${card.suit}-${card.rank}-${index}`} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="action-row">
          <button
            type="button"
            className="primary-btn"
            onClick={() => void placeBetAndDeal()}
            disabled={!gameOver || staking || bet <= 0 || bet > chips}
          >
            {staking ? "Mise…" : "Bet & Play"}
          </button>
          <button className="secondary-btn" onClick={handleHit} disabled={gameOver || !currentHand || handDone[activeHandIndex]}>
            Hit
          </button>
          <button className="secondary-btn" onClick={handleStand} disabled={gameOver || !currentHand || handDone[activeHandIndex]}>
            Stay
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => void handleDouble()}
            disabled={gameOver || staking || !canDouble}
          >
            Double
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => void handleSplit()}
            disabled={gameOver || staking || !canSplit}
          >
            Split
          </button>
        </div>
      </div>
    </div>
  );
}
