import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { clearSession, getStoredUser, saveSession, type StoredUser } from "../lib/authStorage";
import "../styles/auth.css";
import "../styles/game.css";

type AdminUser = {
  id: number;
  email: string;
  username: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
  balance: number;
};

type AdminTransaction = {
  id: number;
  amount: number;
  type: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
};

const API = "http://localhost:3000";

function amountColorByType(type: string): string {
  const t = type.toUpperCase();
  if (t.includes("BET") || t.includes("WITHDRAW")) {
    return "#d93025";
  }
  if (t.includes("PAYOUT") || t.includes("DEPOSIT")) {
    return "#188038";
  }
  return "inherit";
}

function isAdminTransaction(type: string): boolean {
  return type.toUpperCase().startsWith("ADMIN_");
}

export default function Admin() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(getStoredUser);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [amount, setAmount] = useState<number>(100);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const refreshUsers = async () => {
    if (!token) return;
    const res = await axios.get<AdminUser[]>(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
    if (selectedUserId === "" && res.data.length > 0) {
      setSelectedUserId(res.data[0].id);
    }
  };

  const refreshTransactions = async (userId: number, allLogs: boolean) => {
    if (!token) return;
    setLoadingTransactions(true);
    try {
      const res = await axios.get<AdminTransaction[]>(
        `${API}/api/admin/users/${userId}/transactions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactions(allLogs ? res.data : res.data.slice(0, 20));
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get<StoredUser>(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.role !== "ADMIN") {
          navigate("/jeu", { replace: true });
          return;
        }
        setCurrentUser(res.data);
        saveSession(token, res.data);
        return refreshUsers();
      })
      .catch(() => {
        clearSession();
        navigate("/", { replace: true });
      });
  }, [navigate, token]);

  useEffect(() => {
    if (typeof selectedUserId === "number") {
      void refreshTransactions(selectedUserId, showAllLogs);
    } else {
      setTransactions([]);
    }
  }, [selectedUserId, showAllLogs]);

  const handleDeposit = async () => {
    setMessage(null);
    setError(null);
    if (!token) {
      setError("Session invalide.");
      return;
    }
    if (selectedUserId === "") {
      setError("Choisis un joueur.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Montant invalide.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<{ id: number; balance: number }>(
        `${API}/api/admin/users/${selectedUserId}/deposit`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (currentUser?.id === res.data.id) {
        saveSession(token, { ...currentUser, balance: res.data.balance });
        setCurrentUser((prev) => (prev ? { ...prev, balance: res.data.balance } : prev));
      }

      await refreshUsers();
      await refreshTransactions(selectedUserId, showAllLogs);
      setMessage("Solde crédité avec succès.");
    } catch (err) {
      const msg = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(msg ?? "Impossible de créditer le solde.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setMessage(null);
    setError(null);
    if (!token) {
      setError("Session invalide.");
      return;
    }
    if (selectedUserId === "") {
      setError("Choisis un joueur.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Montant invalide.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<{ id: number; balance: number }>(
        `${API}/api/admin/users/${selectedUserId}/withdraw`,
        { amount, reason: "Retrait depuis panneau admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (currentUser?.id === res.data.id) {
        saveSession(token, { ...currentUser, balance: res.data.balance });
        setCurrentUser((prev) => (prev ? { ...prev, balance: res.data.balance } : prev));
      }

      await refreshUsers();
      await refreshTransactions(selectedUserId, showAllLogs);
      setMessage("Solde retiré avec succès.");
    } catch (err) {
      const msg = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(msg ?? "Impossible de retirer le solde.");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setMessage(null);
    setError(null);
    if (!token) {
      setError("Session invalide.");
      return;
    }
    if (selectedUserId === "") {
      setError("Choisis un joueur.");
      return;
    }

    setLoading(true);
    try {
      await axios.patch(
        `${API}/api/admin/users/${selectedUserId}/block`,
        { reason: "Blocage depuis panneau admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshUsers();
      await refreshTransactions(selectedUserId, showAllLogs);
      setMessage("Utilisateur bloqué avec succès.");
    } catch (err) {
      const msg = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(msg ?? "Impossible de bloquer l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setMessage(null);
    setError(null);
    if (!token) {
      setError("Session invalide.");
      return;
    }
    if (selectedUserId === "") {
      setError("Choisis un joueur.");
      return;
    }

    setLoading(true);
    try {
      await axios.patch(
        `${API}/api/admin/users/${selectedUserId}/unblock`,
        { reason: "Déblocage depuis panneau admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshUsers();
      await refreshTransactions(selectedUserId, showAllLogs);
      setMessage("Utilisateur débloqué avec succès.");
    } catch (err) {
      const msg = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(msg ?? "Impossible de débloquer l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <div className="game-header__brand">Admin Panel</div>
        <div className="game-header__player">
          <span className="game-header__name">{currentUser?.username ?? "Admin"}</span>
          <span className="game-header__balance">
            {(currentUser?.balance ?? 0).toFixed(0)} jetons
          </span>
        </div>
      </header>

      <main className="game-main" style={{ maxWidth: 920 }}>
        <p className="game-placeholder">
          Créditer ou retirer de l'argent a un joueur (ou toi-même), puis revenir au jeu :{" "}
          <Link to="/jeu">Retour jeu</Link>
        </p>

        {error ? <p className="auth-message auth-message--error">{error}</p> : null}
        {message ? <p className="auth-message auth-message--success">{message}</p> : null}

        <div style={{ width: "100%", display: "grid", gap: 12 }}>
          <label>
            Joueur cible
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.id} - {u.username ?? u.email} ({u.role}) - {Math.round(u.balance)} jetons
                </option>
              ))}
            </select>
          </label>
          <p>
            Statut actuel : <strong>{selectedUser?.status ?? "-"}</strong>
          </p>

          <label>
            Montant
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            />
          </label>

          <button type="button" disabled={loading || selectedUserId === ""} onClick={handleDeposit}>
            {loading
              ? "Ajout en cours..."
              : `Ajouter de l'argent${selectedUser ? ` a ${selectedUser.username ?? selectedUser.email}` : ""}`}
          </button>
          <button type="button" disabled={loading || selectedUserId === ""} onClick={handleWithdraw}>
            {loading
              ? "Retrait en cours..."
              : `Retirer de l'argent${selectedUser ? ` a ${selectedUser.username ?? selectedUser.email}` : ""}`}
          </button>
          <button
            type="button"
            disabled={loading || selectedUserId === "" || selectedUser?.status === "BLOCKED"}
            onClick={handleBlock}
          >
            {loading ? "Blocage..." : "Bloquer l'utilisateur"}
          </button>
          <button
            type="button"
            disabled={loading || selectedUserId === "" || selectedUser?.status === "ACTIVE"}
            onClick={handleUnblock}
          >
            {loading ? "Déblocage..." : "Débloquer l'utilisateur"}
          </button>
        </div>

        <div style={{ width: "100%", marginTop: 20 }}>
          <h3>
            Transactions du joueur sélectionné ({showAllLogs ? "toutes" : "20 dernières"})
          </h3>
          <button
            type="button"
            disabled={loadingTransactions || selectedUserId === ""}
            onClick={() => setShowAllLogs((v) => !v)}
          >
            {showAllLogs ? "Afficher seulement 20" : "Voir tout les logs du joueur"}
          </button>
          {loadingTransactions ? <p>Chargement...</p> : null}
          {!loadingTransactions && transactions.length === 0 ? (
            <p>Aucune transaction pour ce joueur.</p>
          ) : null}
          {!loadingTransactions && transactions.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th align="left">Date</th>
                    <th align="left">Type</th>
                    <th align="right">Montant</th>
                    <th align="right">Avant</th>
                    <th align="right">Après</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>
                      <td
                        style={{
                          color: amountColorByType(t.type),
                          fontWeight: isAdminTransaction(t.type) ? 700 : 500,
                        }}
                      >
                        {t.type}
                      </td>
                      <td
                        align="right"
                        style={{
                          color: amountColorByType(t.type),
                          fontWeight: isAdminTransaction(t.type) ? 700 : 500,
                        }}
                      >
                        {Math.round(t.amount)}
                      </td>
                      <td align="right">{Math.round(t.balanceBefore)}</td>
                      <td align="right">{Math.round(t.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
