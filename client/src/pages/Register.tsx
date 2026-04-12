import { useState } from "react";
import "../styles/auth.css";
import axios from "axios";

const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 24;

function validateRegister(
  username: string,
  email: string,
  password: string
): string | null {
  const u = username.trim();
  const e = email.trim();
  const p = password;
  if (!u || !e || !p) {
    return "Tous les champs sont obligatoires";
  }
  if (u.length < MIN_USERNAME_LENGTH || u.length > MAX_USERNAME_LENGTH) {
    return `Pseudo : ${MIN_USERNAME_LENGTH} à ${MAX_USERNAME_LENGTH} caractères`;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(u)) {
    return "Pseudo : lettres, chiffres, tiret (-) et underscore (_) uniquement";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return "Adresse e-mail invalide";
  }
  if (p.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`;
  }
  return null;
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    const validationError = validateRegister(username, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3000/register", {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      setSuccess("Compte créé ! Redirection…");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setError(message ?? "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🎰 Register</h2>

        {error ? <p className="auth-message auth-message--error">{error}</p> : null}
        {success ? <p className="auth-message auth-message--success">{success}</p> : null}

        <input
          placeholder="Pseudo (affiché en jeu)"
          autoComplete="username"
          disabled={loading}
          value={username}
          maxLength={MAX_USERNAME_LENGTH}
          onChange={(e) => setUsername(e.target.value)}
        />

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
          autoComplete="new-password"
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="button" disabled={loading} onClick={handleRegister}>
          {loading ? "Création…" : "Créer un compte"}
        </button>

        <span
          className="auth-link"
          onClick={() => !loading && (window.location.href = "/")}
        >
          Déjà un compte ? Login
        </span>
      </div>
    </div>
  );
}
