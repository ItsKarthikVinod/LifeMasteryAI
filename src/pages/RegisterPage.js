import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/authContext'
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth'
import { doSignInAnonymously } from "../firebase/auth";
import GuestButton from "../components/guestButton";

const RegisterPage = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);

  // Validation state
  const [error, setError] = useState([]);
  const [success, setSuccess] = useState("");

  const onGuestSignIn = async (e) => {
    e.preventDefault();
    setIsGuestSigningIn(true);
    try {
      await doSignInAnonymously();
      setSuccess("Signed in as Guest! Redirecting...");
    } catch (err) {
      setError([err.message || "Guest sign-in failed. Please try again."]);
    }
    setIsGuestSigningIn(false);
  };

  const { userLoggedIn } = useAuth();

  // Email regex for basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateFields = () => {
    const errors = [];
    if (!emailRegex.test(email)) {
      errors.push("Please enter a valid email address.");
    }
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      errors.push("Passwords do not match.");
    }
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError([]);
    setSuccess("");

    const errors = validateFields();
    if (errors.length > 0) {
      setError(errors);
      setIsRegistering(false);
      return;
    }

    setIsRegistering(true);
    try {
      await doCreateUserWithEmailAndPassword(email, password);
      setSuccess("Account created successfully! Redirecting...");
      setError([]);
    } catch (err) {
      setError([err.message || "Registration failed. Please try again."]);
    }
    setIsRegistering(false);
  };

  const onGoogleSignIn = (e) => {
    e.preventDefault();
    setError([]);
    setSuccess("");
    if (!isSigningIn) {
      setIsSigningIn(true);
      doSignInWithGoogle().catch((err) => {
        setIsSigningIn(false);
        setError(["Google sign-in failed. Please try again."]);
      });
    }
  };

  return (
    <>
      {userLoggedIn && <Navigate to={"/dashboard"} replace={true} />}

      <main className="w-full h-screen flex self-center place-content-center place-items-center bg-gradient-to-r from-teal-400 to-blue-500">
        <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl bg-white/30">
          <div className="text-center mb-6">
            <div className="mt-2">
              <h3 className="text-gray-800 text-xl font-semibold sm:text-2xl">
                Create a New Account
              </h3>
            </div>
          </div>
          {/* Validation Feedback */}
          {error.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-sm text-left space-y-1">
              {error.map((err, idx) => (
                <div key={idx}>• {err}</div>
              ))}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-2 text-sm text-center">
              {success}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-bold">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError([]);
                  setSuccess("");
                }}
                className={`w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border ${
                  error.some((err) => err.toLowerCase().includes("email"))
                    ? "border-red-400"
                    : "focus:border-indigo-600"
                } shadow-sm rounded-lg transition duration-300`}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-bold">
                Password
              </label>
              <input
                disabled={isRegistering}
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError([]);
                  setSuccess("");
                }}
                className={`w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border ${
                  error.some((err) =>
                    err.toLowerCase().includes("password must be at least")
                  )
                    ? "border-red-400"
                    : "focus:border-indigo-600"
                } shadow-sm rounded-lg transition duration-300`}
              />
              {password.length > 0 && password.length < 6 && (
                <div className="text-xs text-red-500 mt-1">
                  Password must be at least 6 characters.
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-bold">
                Confirm Password
              </label>
              <input
                disabled={isRegistering}
                type="password"
                autoComplete="off"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setconfirmPassword(e.target.value);
                  setError([]);
                  setSuccess("");
                }}
                className={`w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border ${
                  error.some((err) =>
                    err.toLowerCase().includes("do not match")
                  )
                    ? "border-red-400"
                    : "focus:border-indigo-600"
                } shadow-sm rounded-lg transition duration-300`}
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <div className="text-xs text-red-500 mt-1">
                  Passwords do not match.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className={`w-full px-4 py-2 text-white font-medium rounded-lg ${
                isRegistering
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300"
              }`}
            >
              {isRegistering ? "Signing Up..." : "Sign Up"}
            </button>
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link
                to={"/login"}
                className="text-center text-sm hover:underline font-bold"
              >
                Continue
              </Link>
            </div>
          </form>

          <div className="flex flex-row text-center w-full">
            <div className="border-b-2 mb-2.5 mr-2 w-full"></div>
            <div className="text-sm font-bold w-fit">OR</div>
            <div className="border-b-2 mb-2.5 ml-2 w-full"></div>
          </div>
          <button
            disabled={isSigningIn}
            onClick={onGoogleSignIn}
            className={`w-full flex items-center justify-center gap-x-3 py-2.5 border rounded-lg text-sm font-medium  ${
              isSigningIn
                ? "cursor-not-allowed"
                : "hover:bg-gray-100 transition duration-300 active:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_17_40)">
                <path
                  d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"
                  fill="#4285F4"
                />
                <path
                  d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"
                  fill="#34A853"
                />
                <path
                  d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"
                  fill="#FBBC04"
                />
                <path
                  d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"
                  fill="#EA4335"
                />
              </g>
              <defs>
                <clipPath id="clip0_17_40">
                  <rect width="48" height="48" fill="white" />
                </clipPath>
              </defs>
            </svg>
            {isSigningIn ? "Signing In..." : "Continue with Google"}
          </button>
          <GuestButton onClick={onGuestSignIn} loading={isGuestSigningIn} />
        </div>
      </main>
    </>
  );
};

export default RegisterPage;