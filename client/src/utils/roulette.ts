export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

/** Ordre des numéros sur la roue européenne (sens horaire). */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8,
  23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export type BetType =
  | "plein" | "cheval" | "transversale" | "carre" | "sixain"
  | "colonne" | "douzaine"
  | "rouge" | "noir" | "pair" | "impair" | "manque" | "passe";

export interface Bet {
  type: BetType;
  value: string;
  amount: number;
}

export interface BetResult extends Bet {
  won: boolean;
  payout: number;
}

export const PAYOUTS: Record<BetType, number> = {
  plein: 35, cheval: 17, transversale: 11, carre: 8, sixain: 5,
  colonne: 2, douzaine: 2,
  rouge: 1, noir: 1, pair: 1, impair: 1, manque: 1, passe: 1,
};

export function getNumberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

export function getBetLabel(bet: Bet): string {
  switch (bet.type) {
    case "plein": return `Plein ${bet.value}`;
    case "cheval": return `Cheval ${bet.value}`;
    case "transversale": return `Transversale ${bet.value}`;
    case "carre": return `Carré ${bet.value}`;
    case "sixain": return `Sixain ${bet.value}`;
    case "colonne": return `Colonne ${bet.value}`;
    case "douzaine": {
      const map: Record<string, string> = { "1": "1-12", "2": "13-24", "3": "25-36" };
      return `Douzaine ${map[bet.value] ?? bet.value}`;
    }
    case "rouge": return "Rouge";
    case "noir": return "Noir";
    case "pair": return "Pair";
    case "impair": return "Impair";
    case "manque": return "Manque (1-18)";
    case "passe": return "Passe (19-36)";
  }
}

/**
 * Retourne la rotation totale en degrés (horaire) pour que le numéro gagnant
 * soit sous le pointeur (12h) après N tours complets depuis l'angle de départ -90°.
 *
 * Dérivation : secteur i centré à (startAngle + i*SA + SA/2).
 * On veut ce centre = -90° (12h). Rotation = N*360 - winIdx*SA - SA/2.
 */
export function wheelAngleForNumber(winningNumber: number, extraSpins = 6): number {
  const idx = WHEEL_ORDER.indexOf(winningNumber);
  const sectorAngleDeg = 360 / WHEEL_ORDER.length;
  return extraSpins * 360 - idx * sectorAngleDeg - sectorAngleDeg / 2;
}

/**
 * Numéros de la rangée correspondant à `n` sur la table (3 nums en ligne).
 * Ex: n=5 → row [4,5,6]
 */
export function rowNums(n: number): number[] {
  if (n === 0) return [0];
  const row = Math.ceil(n / 3);
  return [row * 3 - 2, row * 3 - 1, row * 3];
}

/** Vérifie que deux numéros sont adjacents horizontalement (même rangée). */
export function areHorizontalNeighbors(a: number, b: number): boolean {
  if (a === 0 || b === 0) return false;
  const rowA = Math.ceil(a / 3);
  const rowB = Math.ceil(b / 3);
  if (rowA !== rowB) return false;
  return Math.abs(a - b) === 1;
}

/** Vérifie que deux numéros sont adjacents verticalement (même colonne). */
export function areVerticalNeighbors(a: number, b: number): boolean {
  if (a === 0 || b === 0) return false;
  const colA = ((a - 1) % 3) + 1;
  const colB = ((b - 1) % 3) + 1;
  return colA === colB && Math.abs(a - b) === 3;
}

export function areAdjacent(a: number, b: number): boolean {
  return areHorizontalNeighbors(a, b) || areVerticalNeighbors(a, b);
}

/** Retourne les 4 numéros d'un carré si `a` est le coin haut-gauche. */
export function squareNums(topLeft: number): number[] | null {
  if (topLeft === 0) return null;
  const col = ((topLeft - 1) % 3) + 1;
  if (col === 3) return null; // pas de voisin à droite
  const row = Math.ceil(topLeft / 3);
  if (row >= 12) return null; // pas de rangée en dessous
  const n1 = topLeft;
  const n2 = topLeft + 1;
  const n3 = topLeft + 3;
  const n4 = topLeft + 4;
  return [n1, n2, n3, n4];
}
