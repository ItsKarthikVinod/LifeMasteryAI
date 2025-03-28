import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase'; // Assuming Firestore is initialized here
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { getAuth } from 'firebase/auth'; // Firebase Authentication
import ChallengeModal from './ChallengeModal';
import ChallengeWidget from './ChallengeWidget';

const Challenges = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  
  const [userChallenges, setUserChallenges] = useState([]); // To store challenges for the logged-in user
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Predefined list of challenges with a duration of 7 days or 14 days
  const predefinedChallenges = [
    { id: 1, name: 'Exercise for 30 minutes', duration: 7 },
    { id: 2, name: 'Read a book for 1 hour', duration: 7 },
    { id: 3, name: 'Meditate for 15 minutes', duration: 14 },
    { id: 4, name: 'Drink 2 liters of water', duration: 14 },
  ];

  // Get the current user from Firebase Authentication
  const auth = getAuth();
  const currentUser = auth.currentUser; // Current logged-in user

  // Fetch challenges from Firestore for all users (if needed)
  // const fetchChallenges = async () => {
  //   try {
  //     const q = query(collection(db, 'challenges'), orderBy('timestamp', 'desc'));
  //     const querySnapshot = await getDocs(q);
  //     const challengesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  //     setChallengesFromFirestore(challengesData);
  //     console.log(challengesFromFirestore)
  //   } catch (error) {
  //     console.error('Error fetching challenges: ', error);
  //   }
  // };

  // Fetch challenges for the current logged-in user
  const fetchUserChallenges = async () => {
    if (currentUser) {
      try {
        const q = query(
          collection(db, 'challenges'),
          where('userId', '==', currentUser.uid), // Filter by user ID
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const userChallengesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserChallenges(userChallengesData); // Set user-specific challenges
        console.log(userChallenges)
      } catch (error) {
        console.error('Error fetching user challenges: ', error);
      }
    }
  };

  // Save selected challenges to Firestore
  const saveChallengesToFirestore = async (challenges) => {
    if (currentUser) {
      try {
        const challengeRef = collection(db, 'challenges');
        challenges.forEach(async (challenge) => {
          await addDoc(challengeRef, {
            name: challenge.name,
            duration: challenge.duration,
            timestamp: new Date(),
            userId: currentUser.uid, // Save user ID along with the challenge
          });
        });
      } catch (error) {
        console.error('Error saving challenges to Firestore: ', error);
      }
    }
  };

  // Toggle Modal visibility
  const handleModalToggle = () => {
    setShowModal(!showModal);
  };

  // Handle the selection of challenges
  const handleSelectChallenges = (challenges) => {
    setSelectedChallenges(challenges);
    setShowModal(false); // Close modal after selecting
    saveChallengesToFirestore(challenges); // Save selected challenges to Firestore
  };

  // Navigate back to the dashboard
  const handleGoBack = () => {
    navigate('/dashboard'); // Replace '/dashboard' with the correct path if needed
  };

  // Fetch challenges when the component is mounted
  useEffect(() => {
    
    fetchUserChallenges(); // Fetch challenges for the logged-in user
  });

  return (
    <div className="p-24">
      <h2 className="text-4xl font-semibold mb-4">Challenges</h2>

      {/* Button to open the modal */}
      <button
        onClick={handleModalToggle}
        className="bg-teal-500 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-400 transition"
      >
        Choose Challenges
      </button>

      {/* Modal for selecting challenges */}
      {showModal && (
        <ChallengeModal
          challenges={predefinedChallenges}
          onSelectChallenges={handleSelectChallenges}
          onClose={handleModalToggle}
        />
      )}

      {/* Display selected challenges as widgets */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedChallenges.map((challenge) => (
          <ChallengeWidget key={challenge.id} challenge={challenge} />
        ))}
      </div>

      {/* Display challenges specific to the logged-in user */}
      {/* <div className="mt-8">
        <h3 className="text-xl font-medium mb-4">Your Ongoing Challenges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userChallenges.length > 0 ? (
            userChallenges.map((challenge) => (
              <ChallengeWidget key={challenge.id} challenge={challenge} />
            ))
          ) : (
            <p>You have no ongoing challenges.</p>
          )}
        </div>
      </div> */}

      {/* Go Back to Dashboard Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleGoBack} // Navigate back to the dashboard
          className="bg-teal-500 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-400 transition"
        >
          Go Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Challenges;
