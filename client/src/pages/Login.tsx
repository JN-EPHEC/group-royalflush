import { useState } from "react";
import "../styles/auth.css";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post<{ token: string }>(
        "http://localhost:3000/login",
        {
          email,
          password,
        }
      );

      console.log(res.data);

      localStorage.setItem("token", res.data.token);

      alert("Login réussi");
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      alert(message ?? "Erreur login");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🎰 Login</h2>

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

        <button type="button" onClick={handleLogin}>
          Se connecter
        </button>

        <span
          className="auth-link"
          onClick={() => (window.location.href = "/register")}
        >
          Pas de compte ? Register
        </span>
      </div>
    </div>
  );
}
