import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";
import "../styles/game.css";
import {
  clearSession,
  getStoredUser,
  saveSession,
  type StoredUser,
} from "../lib/authStorage";

export default function Game() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const cached = getStoredUser();
    if (cached?.username) {
      setUser(cached);
      setLoading(false);
      return;
    }

    axios
      .get<StoredUser>("http://localhost:3000/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        saveSession(token, res.data);
      })
      .catch(() => {
        clearSession();
        navigate("/", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  if (loading || !user) {
    return (
      <div className="game-page">
        <p className="game-loading">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="game-page">
      <header className="game-header">
        <div className="game-header__brand">🎰 Royal Flush</div>
        <div className="game-header__player">
          <span className="game-header__name" title={user.email}>
            {user.username}
          </span>
          <span className="game-header__balance">{user.balance.toFixed(0)} jetons</span>
        </div>
        <button type="button" className="game-header__logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>
      <main className="game-main">
        <p className="game-placeholder">
          Zone de jeu — le pseudo <strong>{user.username}</strong> s’affichera ici dans tes écrans de
          jeu (blackjack, roulette, etc.).
        </p>
        <Link to="/blackjack" className="game-blackjack-link">
          Jouer au Blackjack
        </Link>
      </main>
    </div>
  );
}
