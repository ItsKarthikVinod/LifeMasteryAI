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


const App = () => {
  const { theme } = useAuth();
  const { loading: habitsLoading } = useGetHabits();

  const { loading: goalsLoading } = useGetGoals();
  const { loading: todosLoading } = useGetTodos();
  const { loading: authLoading } = useAuth(); // If your auth context provides loading
  

  


  

  useEffect(() => {
    // 1. Create and inject OneSignal SDK script tag
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
    script.async = true;
    document.body.appendChild(script);

    // 2. Initialize OneSignal after script loads
    script.onload = () => {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(function () {
        window.OneSignal.init({
          appId: "702b4e49-c8a5-4af7-8e99-ce0babb6706a", // ✅ Replace with your real App ID
          serviceWorkerPath: "/service-worker.js", // ✅ Your custom PWA SW
          serviceWorkerScope: "/", // Optional but best practice
          allowLocalhostAsSecureOrigin: true, // For local testing
          notifyButton: {
            enable: true, // Optional: OneSignal bell icon UI
          },
        });
      });
    };
  }, []);
  
  useInactivityReminder(); // Start the inactivity reminder hook
  
  

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
