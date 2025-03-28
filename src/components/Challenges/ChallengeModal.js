import React, { useState } from 'react';

const ChallengeModal = ({ challenges, onSelectChallenges, onClose }) => {
  const [selectedChallenges, setSelectedChallenges] = useState([]);

  // Handle selection of challenges
  const handleChallengeSelect = (challenge) => {
    setSelectedChallenges((prevState) => {
      if (prevState.includes(challenge)) {
        return prevState.filter((item) => item !== challenge);
      } else {
        return [...prevState, challenge];
      }
    });
  };

  // Handle the submit (pass selected challenges to parent)
  const handleSubmit = () => {
    onSelectChallenges(selectedChallenges);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-2xl font-semibold mb-4">Select Challenges</h2>

        {/* List of challenges to select */}
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="flex items-center">
              <input
                type="checkbox"
                id={challenge.id}
                checked={selectedChallenges.includes(challenge)}
                onChange={() => handleChallengeSelect(challenge)}
                className="mr-2"
              />
              <label htmlFor={challenge.id} className="text-lg">
                {challenge.name} - {challenge.duration} Days
              </label>
            </div>
          ))}
        </div>

        {/* Buttons to close or submit */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className="bg-teal-500 text-white px-6 py-3 rounded-lg"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;
