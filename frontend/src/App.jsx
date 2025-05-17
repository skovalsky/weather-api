import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WeatherPage from "./pages/WeatherPage";
import ConfirmPage from "./pages/ConfirmPage";
import UnsubscribePage from "./pages/UnsubscribePage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WeatherPage />} />
        <Route path="/confirm/:token" element={<ConfirmPage />} />
        <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />
      </Routes>
    </Router>
  );
}

export default App;
