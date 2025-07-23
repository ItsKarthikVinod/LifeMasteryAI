import React, {useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroPage from './components/HeroPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './components/Dashboard';
import JournalList from './components/JournalList';
import Challenges from './components/Challenges/Challenges';
import CommunityPage from './components/CommunityPage';
import './App.css'; // Import your CSS file
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
import DemoModeBanner from './components/demoModeBanner'; // Import your demo mode banner
//import { useInactivityReminder } from './hooks/useInactivityReminder';
import OneSignal from "react-onesignal";


const App = () => {
  const { theme, currentUser } = useAuth();
  const isGuest = currentUser && currentUser.isAnonymous;
  const { loading: habitsLoading } = useGetHabits();

  const { loading: goalsLoading } = useGetGoals();
  const { loading: todosLoading } = useGetTodos();
  const { loading: authLoading } = useAuth(); // If your auth context provides loading

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== "undefined") {
      OneSignal.init({
        appId: "47c26c0f-d61b-4716-9f62-f1f84ac305bc",
        // You can add other initialization options here
        notifyButton: {
          enable: true,
        },
        serviceWorkerPath: "/service-worker.js",
      }).then(() => {
        OneSignal.Slidedown.promptPush();
      });
    }
  }, []);

  // useEffect(() => {
  //   // Dynamically load the OneSignal SDK script
  //   const script = document.createElement("script");
  //   script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
  //   script.async = true;
  //   document.body.appendChild(script);

  //   script.onload = () => {
  //     window.OneSignal = window.OneSignal || [];
  //     window.OneSignal.push(function () {
  //       window.OneSignal.init({
  //         appId: "702b4e49-c8a5-4af7-8e99-ce0babb6706a",
  //         notifyButton: { enable: true },
  //         allowLocalhostAsSecureOrigin: true,
  //         serviceWorkerPath: "/service-worker.js",
  //       });

  //       window.OneSignal.getNotificationPermission().then((permission) => {
  //         if (permission === "default") {
  //           window.OneSignal.Slidedown.promptPush();
  //         }
  //       });
  //     });
  //   };

  //   // Optional: cleanup
  //   return () => {
  //     document.body.removeChild(script);
  //   };
  // }, []);

  // useEffect(() => {
  //   // Only run if user is logged in and OneSignal is loaded
  //   if (!currentUser || !window.OneSignal) return;

  //   window.OneSignal.getUserId().then(async (playerId) => {
  //     if (playerId) {
  //       // Save playerId to Firestore with the user's info
  //       await setDoc(
  //         doc(db, "userActivity", currentUser.uid),
  //         {
  //           playerId,
  //           lastActive: Date.now(),
  //           pomodoroStatus: localStorage.getItem("pomodoroStatus") || "stopped",
  //           email: currentUser.email,
  //         },
  //         { merge: true }
  //       );
  //     }
  //   });
  // }, [currentUser]);

  // useInactivityReminder();




  // Show loader if any global data is loading
  if (habitsLoading || goalsLoading || todosLoading || authLoading) {
    return <Loader />;
  }
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <Router>
        <Navbar />
        {isGuest && <Navbar  />}
        {isGuest && <DemoModeBanner />}
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
