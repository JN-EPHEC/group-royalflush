import { type Card, getSuitSymbol, isRedSuit } from "../utils/blackjack";

interface PlayingCardProps {
  card?: Card;
  hidden?: boolean;
}

export default function PlayingCard({ card, hidden = false }: PlayingCardProps) {
  if (hidden) {
    return (
      <div className="playing-card playing-card-back">
        <div className="card-back-pattern"></div>
      </div>
    );
  }

  if (!card) return null;

  const red = isRedSuit(card.suit);

  return (
    <div className={`playing-card ${red ? "red" : "black"}`}>
      <div className="card-corner top-left">
        <span>{card.rank}</span>
        <span>{getSuitSymbol(card.suit)}</span>
      </div>

      <div className="card-center">
        <span>{getSuitSymbol(card.suit)}</span>
      </div>

      <div className="card-corner bottom-right">
        <span>{card.rank}</span>
        <span>{getSuitSymbol(card.suit)}</span>
      </div>
    </div>
  );
}