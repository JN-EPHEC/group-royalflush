const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

/**
 * Base du backend sans slash final.
 * - Dev : http://localhost:3000
 * - Prod (vite build) : chaîne vide → requêtes relatives `/api/...` (même hôte que le front, ex. Nginx).
 */
export const API_BASE_URL =
  raw && raw.length > 0
    ? raw.replace(/\/$/, "")
    : import.meta.env.DEV
      ? "http://localhost:3000"
      : "";
