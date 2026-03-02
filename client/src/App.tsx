import { useEffect, useState } from "react";
import "./App.css";

interface User {
  id: number;
  nom: string;
  prenom: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");

  // 🔄 Charger les users
  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ➕ Ajouter user
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, prenom }),
    });

    setNom("");
    setPrenom("");
    loadUsers();
  };

  // ❌ Supprimer user
  const handleDelete = async (id: number) => {
    await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    loadUsers();
  };

  // ✏️ Modifier user (simple prompt)
  const handleUpdate = async (user: User) => {
    const newNom = prompt("Nouveau nom :", user.nom);
    const newPrenom = prompt("Nouveau prénom :", user.prenom);

    if (!newNom || !newPrenom) return;

    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newNom, prenom: newPrenom }),
    });

    loadUsers();
  };

  return (
    <div>
      <h1>Users</h1>

      {/* FORMULAIRE AJOUT */}
      <form onSubmit={handleAdd}>
        <input
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <input
          placeholder="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.prenom} {u.nom}
            {" "}
            <button onClick={() => handleUpdate(u)}>Modifier</button>
            <button onClick={() => handleDelete(u.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;