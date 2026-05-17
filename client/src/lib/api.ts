const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL =
  raw && raw.length > 0
    ? raw.replace(/\/$/, "")
    : import.meta.env.DEV
      ? "http://localhost:3000"
      : "";
