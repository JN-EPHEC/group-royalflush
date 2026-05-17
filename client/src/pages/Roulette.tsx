import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RouletteWheel from "../components/RouletteWheel";
import RouletteBettingTable from "../components/RouletteBettingTable";
import { type Bet, type BetResult, getBetLabel, getNumberColor } from "../utils/roulette";
import { updateStoredUserBalance } from "../lib/authStorage";
import { API_BASE_URL } from "../lib/api";
import "../styles/roulette.css";

export default function Roulette() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [chipAmount, setChipAmount] = useState(10);
  const [bets, setBets] = useState<Bet[]>([]);

  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [betResults, setBetResults] = useState<BetResult[] | null>(null);
  const [spinDone, setSpinDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load balance from server
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }

    fetch(`${API_BASE_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((u: { balance?: number } | null) => {
        if (u && typeof u.balance === "number") setBalance(u.balance);
      })
      .catch(() => { navigate("/", { replace: true }); });
  }, [navigate]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  function addBet(bet: Bet) {
    setBets((prev) => [...prev, bet]);
    setBetResults(null);
    setMessage(null);
  }

  function removeBet(idx: number) {
    setBets((prev) => prev.filter((_, i) => i !== idx));
    setBetResults(null);
    setMessage(null);
  }

  function clearBets() {
    setBets([]);
    setBetResults(null);
    setMessage(null);
    setWinningNumber(null);
    setSpinDone(false);
  }

  async function handleSpin() {
    if (bets.length === 0 || spinning) return;
    if (totalBet > balance) {
      setMessage("Solde insuffisant pour couvrir toutes les mises.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }

    setSpinning(true);
    setSpinDone(false);
    setBetResults(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/roulette/spin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bets }),
      });

      const json = await res.json().catch(() => ({})) as {
        winningNumber?: number;
        betResults?: BetResult[];
        balance?: number;
        error?: string;
      };

      if (!res.ok) {
        setMessage(json.error ?? "Erreur lors du lancer.");
        setSpinning(false);
        return;
      }

      if (typeof json.winningNumber === "number") {
        setWinningNumber(json.winningNumber);
        setBetResults(json.betResults ?? null);
        if (typeof json.balance === "number") {
          setBalance(json.balance);
          updateStoredUserBalance(json.balance);
        }
        // spinDone is set via onSpinEnd callback after animation
      }
    } catch {
      setMessage("Erreur réseau.");
      setSpinning(false);
    }
  }

  function handleSpinEnd() {
    setSpinning(false);
    setSpinDone(true);

    if (betResults) {
      const totalWon = betResults.reduce((s, b) => s + b.payout, 0);
      const totalStaked = betResults.reduce((s, b) => s + b.amount, 0);
      const net = totalWon - totalStaked;
      if (net > 0) setMessage(`Gagné ! +${net} jetons`);
      else if (net === 0) setMessage("Égalité — mise remboursée.");
      else setMessage(`Perdu. -${Math.abs(net)} jetons`);
    }
  }

  const colorBadge = winningNumber !== null ? getNumberColor(winningNumber) : null;

  return (
    <div className="roulette-page">
      {/* Top bar */}
      <div className="roulette-topbar">
        <span className="roulette-topbar__balance">💰 {Math.round(balance)} jetons</span>
        <label className="roulette-topbar__chip">
          Jeton :
          <input
            type="number"
            min={1}
            max={Math.max(1, balance)}
            value={chipAmount}
            onChange={(e) => setChipAmount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={spinning}
          />
        </label>
        <button type="button" className="roulette-quit-btn" onClick={() => navigate("/jeu")}>
          Quitter
        </button>
      </div>

      <div className="roulette-body">
        {/* Wheel */}
        <div className="roulette-wheel-section">
          <RouletteWheel
            spinning={spinning}
            winningNumber={winningNumber}
            onSpinEnd={handleSpinEnd}
          />

          {winningNumber !== null && (
            <div className={`roulette-result-badge roulette-result-badge--${colorBadge}`}>
              {winningNumber}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="roulette-right">
          {/* Current bets */}
          <div className="roulette-bets-panel">
            <h3>Mises ({bets.length})</h3>
            {bets.length === 0 ? (
              <p style={{ opacity: 0.6, fontSize: "0.88rem", margin: 0 }}>
                Aucune mise — sélectionne un mode et clique sur la table.
              </p>
            ) : (
              <ul className="roulette-bets-list">
                {bets.map((b, i) => {
                  const result = spinDone && betResults ? betResults[i] : null;
                  return (
                    <li
                      key={i}
                      className={`roulette-bet-item${result ? (result.won ? " roulette-bet-item--win" : " roulette-bet-item--lose") : ""}`}
                    >
                      <span className="roulette-bet-item__label">{getBetLabel(b)}</span>
                      <span className="roulette-bet-item__amount">{b.amount} jtns</span>
                      {result && result.won && (
                        <span style={{ color: "#2ecc71", fontWeight: 700 }}>+{result.payout}</span>
                      )}
                      {!spinning && !spinDone && (
                        <button
                          type="button"
                          className="roulette-bet-item__remove"
                          onClick={() => removeBet(i)}
                        >
                          ×
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="roulette-bets-summary">
              Total misé : <strong>{totalBet}</strong> jetons
            </p>
          </div>

          {/* Actions */}
          <div className="roulette-actions">
            <button
              type="button"
              className="roulette-spin-btn"
              disabled={spinning || bets.length === 0 || totalBet > balance}
              onClick={() => void handleSpin()}
            >
              {spinning ? "La roue tourne…" : "🎲 Lancer"}
            </button>
            <button
              type="button"
              className="roulette-clear-btn"
              disabled={spinning || (bets.length === 0 && winningNumber === null)}
              onClick={clearBets}
            >
              Effacer
            </button>
          </div>

          {message && (
            <div className={`roulette-message ${message.startsWith("Gagné") ? "roulette-message--win" : "roulette-message--neutral"}`}>
              {message}
            </div>
          )}

          {/* Betting table */}
          <RouletteBettingTable
            disabled={spinning || spinDone}
            chipAmount={chipAmount}
            bets={bets}
            onAddBet={addBet}
          />
        </div>
      </div>
    </div>
  );
}
