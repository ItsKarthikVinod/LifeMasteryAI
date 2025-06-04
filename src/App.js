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

import Footer from './components/Footer'
import {useAuth} from './contexts/authContext';

import SettingsPage from './pages/SettingsPage';
import WhiteBoard from './components/WhiteBoard';
import WhiteboardGallery from './components/WhiteBoardGallery';
import StatusBanner from './components/StatusBanner';
import useGetHabits from "./hooks/useGetHabits";
import useGetGoals from "./hooks/useGetGoals";
import useGetTodos from "./hooks/useGetTodos";
import Loader from './components/Loader'; // Assuming you have a Loader component
import Grocery from "./components/Grocery";

const App = () => {
  const { theme } = useAuth();
  const { loading: habitsLoading } = useGetHabits();
  const { loading: goalsLoading } = useGetGoals();
  const { loading: todosLoading } = useGetTodos();
  const { loading: authLoading } = useAuth(); // If your auth context provides loading
  

  // Show loader if any global data is loading
  if (habitsLoading || goalsLoading || todosLoading || authLoading) {
    return <Loader />;
  }
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <Router>
        <Navbar />
        <StatusBanner />
        <Routes>
          <Route path="/" element={<HeroPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journal-list" element={<JournalList />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/whiteboard" element={<WhiteBoard />} />
          <Route path="/whiteboard-gallery" element={<WhiteboardGallery />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/grocery" element={<Grocery />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
