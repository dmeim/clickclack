import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Connect from "./pages/Connect";
import Host from "./pages/Host";
import Join from "./pages/Join";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/connect/host" element={<Host />} />
      <Route path="/connect/join" element={<Join />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/tos" element={<TermsOfService />} />
    </Routes>
  );
}
