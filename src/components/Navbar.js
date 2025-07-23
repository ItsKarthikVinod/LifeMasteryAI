import { useState, useRef} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

import { doSignOut } from "../firebase/auth";
import Logo from "../assets/LifeMasteryLogo.png";
import {
  FaRobot,
  FaUserCircle,
  FaChevronDown,
  FaChalkboard,
  FaListAlt,
  FaShoppingBasket,
  FaCog,
  FaSignOutAlt,
  FaImages,
} from "react-icons/fa";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const navigate = useNavigate();

  const {  userLoggedIn } = useAuth();

  
  // Dropdown refs for click outside
  const toolsDropdownRef = useRef();
  const userDropdownRef = useRef();

  const handleSignOut = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    try {
      setIsMenuOpen(false);
      setUserDropdownOpen(false);
      await doSignOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Helper to close all dropdowns and menu
  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setToolsDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <nav className="bg-gray-800 bg-opacity-50 backdrop-blur-lg text-white p-6 fixed top-0 left-0 w-full z-50">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Website Logo */}
          <img
            src={Logo}
            alt="Life Mastery Logo"
            className="w-14 h-14 transform hover:scale-110 transition duration-300"
          />

          {/* Website Name and AI Badge */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Website Name */}
            <Link
              to="/"
              className="text-2xl  font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-transparent bg-clip-text hover:from-green-300 hover:via-green-400 hover:to-green-500 transition-all duration-500 transform hover:scale-110 font-poppins sm:text-3xl md:text-4xl"
              onClick={closeAllMenus}
            >
              Life Mastery
            </Link>

            {/* AI Badge */}
            <div className="relative flex items-center bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-20">
              <FaRobot className="text-sm sm:text-base md:text-lg mr-1 sm:mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold">AI</span>
              {/* Sparkle Effects */}
              <div className="absolute -top-2 lg:right-1 -right-3  w-10 sm:w-12 h-10 sm:h-12">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-400 rounded-full animate-bounce-slow absolute top-2 left-6 sm:left-9 -z-10"></div>
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-300 rounded-full animate-bounce-slow absolute bottom-3 sm:bottom-3 -left-2 sm:-left-3 -z-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-8 items-center">
          <Link
            to="/"
            className="text-2xl hover:text-gray-300 transition-all duration-300 transform hover:scale-105"
            onClick={closeAllMenus}
          >
            Home
          </Link>
          {userLoggedIn && (
            <Link
              to="/dashboard"
              className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
              onClick={closeAllMenus}
            >
              Dashboard
            </Link>
          )}

          {/* Tools Dropdown */}
          <div className="relative" ref={toolsDropdownRef}>
            <button
              onClick={() => setToolsDropdownOpen((v) => !v)}
              className="flex items-center text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105 focus:outline-none"
              type="button"
            >
              Productivity
              <FaChevronDown className="ml-1 text-base" />
            </button>
            {toolsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white text-gray-800 rounded-lg shadow-lg py-2 z-50">
                <Link
                  to="/whiteboard"
                  className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                  onClick={closeAllMenus}
                >
                  <FaChalkboard className="mr-2" /> Whiteboard
                </Link>
                <Link
                  to="/whiteboard-gallery"
                  className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                  onClick={closeAllMenus}
                >
                  <FaImages className="mr-2" /> Whiteboard Gallery
                </Link>
                <Link
                  to="/recipes"
                  className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                  onClick={closeAllMenus}
                >
                  <FaListAlt className="mr-2" /> Recipes
                </Link>
                <Link
                  to="/grocery"
                  className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                  onClick={closeAllMenus}
                >
                  <FaShoppingBasket className="mr-2" /> Grocery List
                </Link>
              </div>
            )}
          </div>

          {/* Community Tab */}
          <Link
            to="/community"
            className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
            onClick={closeAllMenus}
          >
            Community
          </Link>

          {userLoggedIn && (
            <>
              {/* User Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="flex items-center text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105 focus:outline-none"
                  type="button"
                >
                  <FaUserCircle className="text-3xl mr-1" />
                  <FaChevronDown className="ml-1 text-base" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                      onClick={closeAllMenus}
                    >
                      <FaCog className="mr-2" /> Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 hover:bg-teal-100 transition text-left"
                    >
                      <FaSignOutAlt className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {!userLoggedIn && (
            <>
              <Link
                to="/login"
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                onClick={closeAllMenus}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                onClick={closeAllMenus}
              >
                Register
              </Link>
            </>
          )}
          {userLoggedIn && (<div className="text-gray-500">
            <NotificationBell />
          </div> )}
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-white hover:text-teal-400 focus:outline-none"
            aria-label="Toggle Menu"
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
          { userLoggedIn &&  <div className="text-gray-500 text-xs ">
            <NotificationBell
            />
          </div>}
        </div>
      </div>

      {/* Mobile Menu (hidden by default) */}
      <div
        className={`md:hidden flex flex-col space-y-4 mt-4 ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        <Link
          to="/"
          className="text-lg text-center hover:text-teal-400"
          onClick={closeAllMenus}
        >
          Home
        </Link>
        {userLoggedIn && (
          <Link
            to="/dashboard"
            className="text-lg text-center hover:text-teal-400"
            onClick={closeAllMenus}
          >
            Dashboard
          </Link>
        )}
        {/* Tools Dropdown for mobile */}
        <div className="relative" ref={toolsDropdownRef}>
          <button
            onClick={() => setToolsDropdownOpen((v) => !v)}
            className="flex items-center justify-center w-full text-lg hover:text-teal-400 transition focus:outline-none"
            type="button"
          >
            Productivity
            <FaChevronDown className="ml-1 text-base" />
          </button>
          {toolsDropdownOpen && (
            <div className="w-full bg-white text-gray-800 rounded-lg shadow-lg py-2 mt-1 z-50">
              <Link
                to="/whiteboard"
                className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                onClick={closeAllMenus}
              >
                <FaChalkboard className="mr-2" /> Whiteboard
              </Link>
              <Link
                to="/whiteboard-gallery"
                className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                onClick={closeAllMenus}
              >
                <FaImages className="mr-2" /> Whiteboard Gallery
              </Link>
              <Link
                to="/recipes"
                className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                onClick={closeAllMenus}
              >
                <FaListAlt className="mr-2" /> Recipes
              </Link>
              <Link
                to="/grocery"
                className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                onClick={closeAllMenus}
              >
                <FaShoppingBasket className="mr-2" /> Grocery List
              </Link>
            </div>
          )}
        </div>
        {/* Community Tab for mobile */}
        <Link
          to="/community"
          className="text-lg text-center hover:text-teal-400"
          onClick={closeAllMenus}
        >
          Community
        </Link>
        {userLoggedIn ? (
          <>
            {/* User Dropdown for mobile */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center justify-center w-full text-lg hover:text-teal-400 transition focus:outline-none"
                type="button"
              >
                <FaUserCircle className="text-2xl mr-1" />
                <FaChevronDown className="ml-1 text-base" />
              </button>
              {userDropdownOpen && (
                <div className="w-full bg-white text-gray-800 rounded-lg shadow-lg py-2 mt-1 z-50">
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 hover:bg-teal-100 transition"
                    onClick={closeAllMenus}
                  >
                    <FaCog className="mr-2" /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeAllMenus();
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-teal-100 transition text-left"
                  >
                    <FaSignOutAlt className="mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-lg text-center hover:text-teal-400"
              onClick={closeAllMenus}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-lg text-center hover:text-teal-400"
              onClick={closeAllMenus}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
export default Navbar;