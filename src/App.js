import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroPage from './components/HeroPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './components/Dashboard';
import JournalList from './components/JournalList';
import Challenges from './components/Challenges/Challenges';
import CommunityPage from './components/CommunityPage';
import FullscreenPomodoro from './components/FullScreenPomodoro';
import Footer from './components/Footer'
import Settings from './components/Settings';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal-list" element={<JournalList />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/pomodoro/fullscreen" element={<FullscreenPomodoro />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
