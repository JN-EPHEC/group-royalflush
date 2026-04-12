import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import axios from "axios";
import { saveSession, type StoredUser } from "../lib/authStorage";

function validateLogin(email: string, password: string): string | null {
  const e = email.trim();
  const p = password;
  if (!e || !p) {
    return "Tous les champs sont obligatoires";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return "Adresse e-mail invalide";
  }
  return null;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    const validationError = validateLogin(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<{
        token: string;
        user: StoredUser;
      }>("http://localhost:3000/login", {
        email: email.trim(),
        password,
      });

      saveSession(res.data.token, res.data.user);
      setSuccess(`Bienvenue, ${res.data.user.username} !`);
      setTimeout(() => navigate("/jeu", { replace: true }), 600);
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(message ?? "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🎰 Login</h2>

        {error ? <p className="auth-message auth-message--error">{error}</p> : null}
        {success ? <p className="auth-message auth-message--success">{success}</p> : null}

        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="button" disabled={loading} onClick={handleLogin}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <span
          className="auth-link"
          onClick={() => !loading && (window.location.href = "/register")}
        >
          Pas de compte ? Register
        </span>
      </div>
    </div>
  );
}
