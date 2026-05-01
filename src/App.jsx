import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Practice from "../components/Practice";
import Cases from "../components/Cases";
import Landing from "./Landing";
import Signup from "./Signup.jsx";
import ProfilePage from "../components/Profile.jsx";
import { QuestionProvider } from "./context/QuestionContext";
import Login from "./Login.jsx";
const AppContent = () => {
  const location = useLocation();
  const showNav = location.pathname !== "/";
  return (
    <div className="app">
      {showNav && <Nav />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/progress" element={<ProfilePage />} />
      </Routes>
      <Footer />
    </div>
  );
};

// Main App component with Router at the top level
const App = () => {
  return (
    <QuestionProvider>
      <Router>
        <AppContent />
      </Router>
    </QuestionProvider>
  );
};

export default App;
