import React from "react";
import { useAuth } from "../contexts/authContext";

const Footer = () => {
  const { theme } = useAuth();
  const isDark = theme === "dark";

  return (
    <footer
      className={`w-full py-6 ${isDark ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"} border-t ${isDark ? "border-gray-800" : "border-gray-300"}`}
    >
      <div className="container mx-auto px-4 text-center">
        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
          {/* Copyright */}
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Karthik Vinod. All rights
            reserved.
          </div>

          {/* Contact */}
          <div className="text-sm">
            <a
              href="mailto:karthivinu1122@gmail.com"
              className={`hover:underline transition duration-200 ${isDark ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-800"}`}
            >
              Contact me
            </a>
          </div>

          {/* YouTube Link */}
          <div>
            <a
              href="http://www.youtube.com/@LifeMastery-o9y"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center p-2 rounded-full transition duration-200 ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"}`}
              title="Visit my YouTube channel"
            >
              {/* Custom YouTube SVG Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 48 48"
                className={isDark ? "text-red-500" : "text-red-600"}
              >
                <path
                  fill="currentColor"
                  d="M43.2,33.9c-0.4,2.1-2.1,3.7-4.2,4c-3.3,0.5-8.8,1.1-15,1.1c-6.1,0-11.6-0.6-15-1.1c-2.1-0.3-3.8-1.9-4.2-4C4.4,31.6,4,28.2,4,24c0-4.2,0.4-7.6,0.8-9.9c0.4-2.1,2.1-3.7,4.2-4C12.3,9.6,17.8,9,24,9c6.2,0,11.6,0.6,15,1.1c2.1,0.3,3.8,1.9,4.2,4c0.4,2.3,0.9,5.7,0.9,9.9C44,28.2,43.6,31.6,43.2,33.9z"
                />
                <path fill="white" d="M20 31L20 17 32 24z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Additional Links or Tagline */}
        <div className="mt-4 text-xs opacity-75">
          Built with ❤️ for productivity and growth.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
