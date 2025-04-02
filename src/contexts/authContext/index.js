import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";
import {
  GoogleAuthProvider,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light"); // Theme state

  // Function to update the user's profile (displayName and photoURL)
  const updateProfile = async (newProfile) => {
    if (currentUser) {
      try {
        await firebaseUpdateProfile(currentUser, newProfile); // Update Firebase Auth profile
        setCurrentUser({ ...currentUser, ...newProfile }); // Update local state
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };

  // Function to toggle between light and dark themes
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme); // Save theme to localStorage
      return newTheme;
    });
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user) {
    if (user) {
      setCurrentUser(user);

      // Check if the provider is email and password login
      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      // Check if the auth provider is Google or not
      const isGoogle = user.providerData.some(
        (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
      );
      setIsGoogleUser(isGoogle);

      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }

    setLoading(false);
  }

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    updateProfile,
    toggleTheme,
    theme,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
