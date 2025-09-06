import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import CompliancePage from "./components/CompliancePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/compliance/:country" element={<CompliancePage />} />
      </Routes>
    </Router>
  );
}
