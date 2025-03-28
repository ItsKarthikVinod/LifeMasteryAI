import React, { useState, useEffect } from 'react';

// Function to calculate the progress percentage
const calculateProgress = (startDate, durationInDays) => {
  const currentDate = new Date();
  const elapsedTime = (currentDate - new Date(startDate)) / (1000 * 60 * 60 * 24); // in days
  const progress = Math.min((elapsedTime / durationInDays) * 100, 100);
  return progress;
};

const ChallengeWidget = ({ challenge }) => {
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState(new Date()); // Assume challenge starts today
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (isStarted) {
      const interval = setInterval(() => {
        setProgress(calculateProgress(startDate, challenge.duration));
      }, 86400000); // Update progress every 24 hours (1 day)

      return () => clearInterval(interval); // Cleanup interval on unmount
    }
  }, [startDate, isStarted, challenge.duration]);

  // Start challenge button
  const handleStartChallenge = () => {
    setIsStarted(true);
    setStartDate(new Date()); // Set start date to current date
  };

  return (
    <div className="bg-white p-6 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold">{challenge.name}</h3>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-teal-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">{Math.round(progress)}% Completed</p>
      </div>

      {/* Start Challenge Button */}
      {!isStarted && (
        <button
          onClick={handleStartChallenge}
          className="mt-4 bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-400 transition"
        >
          Start Challenge
        </button>
      )}
      {isStarted && (
        <p className="mt-2 text-sm text-gray-500">Challenge started on: {startDate.toLocaleDateString()}</p>
      )}
    </div>
  );
};

export default ChallengeWidget;
