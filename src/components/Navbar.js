import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { doSignOut } from "../firebase/auth";
import Logo from "../assets/LifeMasteryLogo.png";
import { FaRobot } from "react-icons/fa"; // Import AI icon

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userLoggedIn = false } = useAuth(); // Safeguard against undefined value
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      setIsMenuOpen(false); // Close the menu if it's open
      await doSignOut(); // Handle sign-out
      navigate("/login"); // Navigate to login page after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
              className="text-2xl font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-transparent bg-clip-text hover:from-green-300 hover:via-green-400 hover:to-green-500 transition-all duration-500 transform hover:scale-110 font-poppins sm:text-3xl md:text-4xl"
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

        <div className="hidden md:flex space-x-6">
          <Link
            to="/"
            className="text-2xl hover:text-gray-300 transition-all duration-300 transform hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          {userLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/community"
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </Link>
              <button
                onClick={handleSignOut }
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-2xl hover:text-teal-400 transition-all duration-300 transform hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-white hover:text-teal-400 focus:outline-none"
            aria-label="Toggle Menu"
            
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
        </div>
      </div>

      {/* Mobile Menu (hidden by default) */}
      <div
        className={`md:hidden flex flex-col space-y-4 mt-4 ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        {userLoggedIn ? (
          <>
            <Link
              to="/dashboard"
              className="text-lg text-center hover:text-teal-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/community"
              className="text-lg text-center hover:text-teal-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Community
            </Link>
            <button
              onClick={handleSignOut}
              className="text-lg text-center hover:text-teal-400"
              
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
                className="text-lg text-center hover:text-teal-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
                className="text-lg text-center hover:text-teal-400"
              onClick={() => setIsMenuOpen(false)}
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
