import { useState } from "react";
import "../styles/auth.css";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:3000/register", {
        username,
        email,
        password,
      });

      alert("Compte créé !");
      window.location.href = "/";
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      alert(message ?? "Erreur register");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🎰 Register</h2>

        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="button" onClick={handleRegister}>
          Créer un compte
        </button>

        <span
          className="auth-link"
          onClick={() => (window.location.href = "/")}
        >
          Déjà un compte ? Login
        </span>
      </div>
    </div>
  );
}
