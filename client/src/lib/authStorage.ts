/** Profil stocké après login (affichage en jeu). */
export type StoredUser = {
  id: number;
  email: string;
  username: string;
  balance: number;
};

const USER_KEY = "user";

export function saveSession(token: string, user: StoredUser) {
  localStorage.setItem("token", token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem(USER_KEY);
}
