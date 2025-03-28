import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-gray-800 text-white py-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Karthik Vinod. All rights reserved.
        </p>
        <p className="text-sm mt-2">
          <a
            href="mailto:karthivinu1122@gmail.com"
            className="text-teal-400 hover:text-teal-600 transition duration-200"
          >
            Contact me
          </a>
        </p>

        {/* YouTube Icon Button */}
        <div>
          <a
            href="http://www.youtube.com/@LifeMastery-o9y"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2  rounded-full transition duration-200"
          >
            {/* Custom YouTube SVG Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36" // Adjust the width to fit the button
              height="36" // Adjust the height to fit the button
              viewBox="0 0 48 48"
              className="text-white"
            >
              <path
                fill="#FF3D00"
                d="M43.2,33.9c-0.4,2.1-2.1,3.7-4.2,4c-3.3,0.5-8.8,1.1-15,1.1c-6.1,0-11.6-0.6-15-1.1c-2.1-0.3-3.8-1.9-4.2-4C4.4,31.6,4,28.2,4,24c0-4.2,0.4-7.6,0.8-9.9c0.4-2.1,2.1-3.7,4.2-4C12.3,9.6,17.8,9,24,9c6.2,0,11.6,0.6,15,1.1c2.1,0.3,3.8,1.9,4.2,4c0.4,2.3,0.9,5.7,0.9,9.9C44,28.2,43.6,31.6,43.2,33.9z"
              ></path>
              <path
                fill="#FFF"
                d="M20 31L20 17 32 24z"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
