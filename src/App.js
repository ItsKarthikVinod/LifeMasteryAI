import React,{useEffect} from 'react';
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
import InstallPrompt from './components/InstallPrompt'; 
import Recipes from './components/Recipes';
import Planner from './components/Planner';
import RecipeSharePage from './components/RecipeSharePage'; // Import your recipe share page
import { useInactivityReminder } from './hooks/useInactivityReminder';
import OneSignal from 'react-onesignal'; // Import OneSignal for push notifications


const App = () => {
  const { theme } = useAuth();
  const { loading: habitsLoading } = useGetHabits();

  const { loading: goalsLoading } = useGetGoals();
  const { loading: todosLoading } = useGetTodos();
  const { loading: authLoading } = useAuth(); // If your auth context provides loading

  useEffect(() => {
    async function setupOneSignal() {
      await OneSignal.init({
        appId: "702b4e49-c8a5-4af7-8e99-ce0babb6706a",
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: "/service-worker.js",
      });

      // Use the correct NPM API for permission and prompt
      const permission = await OneSignal.getNotificationPermission();

      if (permission === "default") {
        // Show the permission prompt
        await OneSignal.showSlidedownPrompt();
      } else {
        console.log("🟡 Notification permission already granted or blocked.");
      }
    }

    setupOneSignal();
  }, []);

  useInactivityReminder();


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
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/recipes/share/:id" element={<RecipeSharePage />} />
        </Routes>
        <Footer />
      </Router>
      <InstallPrompt />
    </div>
  );
};

export default App;
