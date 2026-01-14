import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Connect from "./pages/Connect";
import Host from "./pages/Host";
import Join from "./pages/Join";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/connect/host" element={<Host />} />
      <Route path="/connect/join" element={<Join />} />
    </Routes>
  );
}
