import { useState } from "react";
import {
  type Bet,
  type BetType,
  getNumberColor,
  areAdjacent,
  rowNums,
  squareNums,
  PAYOUTS,
} from "../utils/roulette";

interface Props {
  disabled: boolean;
  chipAmount: number;
  bets: Bet[];
  onAddBet: (bet: Bet) => void;
}

type Mode = "plein" | "cheval" | "transversale" | "carre" | "sixain";

const MODE_LABELS: { mode: Mode; label: string; payout: number }[] = [
  { mode: "plein", label: "Plein", payout: 35 },
  { mode: "cheval", label: "Cheval", payout: 17 },
  { mode: "transversale", label: "Transversale", payout: 11 },
  { mode: "carre", label: "Carré", payout: 8 },
  { mode: "sixain", label: "Sixain", payout: 5 },
];

/** CSS grid position for number n (1-36). */
function gridPos(n: number) {
  const col = Math.ceil(n / 3);
  const row = n % 3 === 0 ? 1 : n % 3 === 2 ? 2 : 3;
  return { col, row };
}

/** Clé de cellule pour afficher le jeton d'une mise. */
function chipKey(bet: Bet): string {
  switch (bet.type) {
    case "plein": return `n-${bet.value}`;
    case "cheval":
    case "transversale":
    case "carre":
    case "sixain": {
      const first = Math.min(...bet.value.split("-").map(Number));
      return `n-${first}`;
    }
    case "colonne": return `col-${bet.value}`;
    case "douzaine": return `doz-${bet.value}`;
    default: return `out-${bet.type}`;
  }
}

/** Construit une map cellKey → montant total des mises. */
function buildChipMap(bets: Bet[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const bet of bets) {
    const key = chipKey(bet);
    map.set(key, (map.get(key) ?? 0) + bet.amount);
  }
  return map;
}

interface ChipProps { amount: number }
function Chip({ amount }: ChipProps) {
  return (
    <div className="rt-chip">
      {amount >= 1000 ? `${Math.round(amount / 1000)}k` : amount}
    </div>
  );
}

export default function RouletteBettingTable({ disabled, chipAmount, bets, onAddBet }: Props) {
  const [mode, setMode] = useState<Mode>("plein");
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const chipMap = buildChipMap(bets);

  function addBet(type: BetType, value: string) {
    onAddBet({ type, value, amount: chipAmount });
    setFirstPick(null);
  }

  function handleNumberClick(n: number) {
    if (disabled) return;

    if (mode === "plein") {
      addBet("plein", String(n));
      return;
    }

    if (mode === "cheval") {
      if (firstPick === null) { setFirstPick(n); return; }
      if (firstPick === n) { setFirstPick(null); return; }
      if (areAdjacent(firstPick, n)) {
        addBet("cheval", [firstPick, n].sort((a, b) => a - b).join("-"));
      } else {
        setFirstPick(n);
      }
      return;
    }

    if (mode === "transversale") {
      addBet("transversale", rowNums(n).join("-"));
      return;
    }

    if (mode === "carre") {
      if (firstPick === null) { setFirstPick(n); return; }
      const candidates = [firstPick, n, firstPick - 1, firstPick - 3, firstPick - 4];
      for (const tl of candidates) {
        const sq = squareNums(tl);
        if (sq && sq.includes(firstPick) && sq.includes(n)) {
          addBet("carre", sq.join("-"));
          return;
        }
      }
      setFirstPick(n);
      return;
    }

    if (mode === "sixain") {
      const row = rowNums(n);
      const rowStart = row[0];
      if (rowStart <= 33) {
        addBet("sixain", [...row, rowStart + 3, rowStart + 4, rowStart + 5].join("-"));
      } else if (rowStart >= 4) {
        addBet("sixain", [rowStart - 3, rowStart - 2, rowStart - 1, ...row].join("-"));
      }
      return;
    }
  }

  function highlightedNums(): Set<number> {
    const s = new Set<number>();
    if (firstPick !== null) s.add(firstPick);
    if (hovered === null) return s;

    switch (mode) {
      case "plein":
        s.add(hovered);
        break;
      case "cheval":
        s.add(hovered);
        break;
      case "transversale":
        rowNums(hovered).forEach((x) => s.add(x));
        break;
      case "carre": {
        s.add(hovered);
        if (firstPick !== null) {
          const candidates = [firstPick, hovered, firstPick - 1, firstPick - 3, firstPick - 4];
          for (const tl of candidates) {
            const sq = squareNums(tl);
            if (sq && sq.includes(firstPick) && sq.includes(hovered)) {
              sq.forEach((x) => s.add(x));
              break;
            }
          }
        }
        break;
      }
      case "sixain": {
        const row = rowNums(hovered);
        const rs = row[0];
        row.forEach((x) => s.add(x));
        if (rs <= 33) [rs + 3, rs + 4, rs + 5].forEach((x) => s.add(x));
        else if (rs >= 4) [rs - 3, rs - 2, rs - 1].forEach((x) => s.add(x));
        break;
      }
    }
    return s;
  }

  const hl = highlightedNums();

  return (
    <div className="rt-wrapper">
      {/* Mode selector */}
      <div className="rt-modes">
        {MODE_LABELS.map(({ mode: m, label, payout }) => (
          <button
            key={m}
            type="button"
            className={`rt-mode-btn ${mode === m ? "rt-mode-btn--active" : ""}`}
            onClick={() => { setMode(m); setFirstPick(null); }}
          >
            {label} <span className="rt-payout">{payout}:1</span>
          </button>
        ))}
      </div>

      {firstPick !== null && (
        <p className="rt-hint">
          {mode === "cheval"
            ? `Clique un numéro adjacent à ${firstPick}`
            : `Premier : ${firstPick} — clique le second pour compléter la mise`}
        </p>
      )}

      {/* Number grid */}
      <div className="rt-grid">
        {/* Zero spans all 3 rows */}
        <div
          className={`rt-cell rt-cell--green rt-zero-cell${hl.has(0) ? " rt-cell--highlight" : ""}`}
          style={{ gridColumn: 1, gridRow: "1 / 4" }}
          onClick={() => !disabled && addBet("plein", "0")}
          onMouseEnter={() => setHovered(0)}
          onMouseLeave={() => setHovered(null)}
        >
          0
          {chipMap.has("n-0") && <Chip amount={chipMap.get("n-0")!} />}
        </div>

        {/* Numbers 1-36 */}
        {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
          const { col, row } = gridPos(n);
          const color = getNumberColor(n);
          const isHl = hl.has(n);
          const chipAmount2 = chipMap.get(`n-${n}`);
          return (
            <div
              key={n}
              className={`rt-cell rt-cell--${color}${isHl ? " rt-cell--highlight" : ""}`}
              style={{ gridColumn: col + 1, gridRow: row, position: "relative" }}
              onClick={() => handleNumberClick(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
            >
              {n}
              {chipAmount2 !== undefined && <Chip amount={chipAmount2} />}
            </div>
          );
        })}

        {/* Colonne markers */}
        {([
          { row: 1, val: "1", title: "Colonne 3,6,9… (2:1)" },
          { row: 2, val: "2", title: "Colonne 2,5,8… (2:1)" },
          { row: 3, val: "3", title: "Colonne 1,4,7… (2:1)" },
        ] as { row: number; val: string; title: string }[]).map(({ row, val, title }) => {
          const chip = chipMap.get(`col-${val}`);
          return (
            <div
              key={`col-${val}`}
              className="rt-cell rt-outside-cell"
              style={{ gridColumn: 14, gridRow: row, position: "relative" }}
              onClick={() => !disabled && addBet("colonne", val)}
              title={title}
            >
              2:1
              {chip !== undefined && <Chip amount={chip} />}
            </div>
          );
        })}
      </div>

      {/* Douzaines */}
      <div className="rt-dozens">
        {[
          { v: "1", label: "1re douzaine (1-12)" },
          { v: "2", label: "2e douzaine (13-24)" },
          { v: "3", label: "3e douzaine (25-36)" },
        ].map(({ v, label }) => {
          const chip = chipMap.get(`doz-${v}`);
          return (
            <div
              key={v}
              className="rt-outside-btn"
              style={{ position: "relative" }}
              onClick={() => !disabled && addBet("douzaine", v)}
            >
              {label}
              <span className="rt-payout">2:1</span>
              {chip !== undefined && <Chip amount={chip} />}
            </div>
          );
        })}
      </div>

      {/* Outside bets */}
      <div className="rt-outside-row">
        {(
          [
            { type: "manque" as BetType, label: "Manque\n1–18" },
            { type: "pair" as BetType, label: "Pair" },
            { type: "rouge" as BetType, label: "Rouge", cls: "rt-outside--rouge" },
            { type: "noir" as BetType, label: "Noir", cls: "rt-outside--noir" },
            { type: "impair" as BetType, label: "Impair" },
            { type: "passe" as BetType, label: "Passe\n19–36" },
          ] as { type: BetType; label: string; cls?: string }[]
        ).map(({ type, label, cls }) => {
          const chip = chipMap.get(`out-${type}`);
          return (
            <div
              key={type}
              className={`rt-outside-btn ${cls ?? ""}`}
              style={{ position: "relative" }}
              onClick={() => !disabled && addBet(type, type)}
            >
              <span style={{ whiteSpace: "pre-line", textAlign: "center" }}>{label}</span>
              <span className="rt-payout">{PAYOUTS[type]}:1</span>
              {chip !== undefined && <Chip amount={chip} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
