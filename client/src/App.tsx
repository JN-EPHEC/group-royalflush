import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Game from "./pages/Game";
import Blackjack from "./pages/BlackJack";
import Roulette from "./pages/Roulette";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jeu" element={<Game />} />
        <Route path="/blackjack" element={<Blackjack />} />
        <Route path="/roulette" element={<Roulette />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;