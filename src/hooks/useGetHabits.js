import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const useGetHabits = () => {
    const [fetchedHabits, setFetchedHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHabits = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not logged in');
            }

            const db = getFirestore();
            const habitsRef = collection(db, 'habits');
            const q = query(habitsRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);

            const habitsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setFetchedHabits(habitsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    return { fetchedHabits, loading, error, fetchHabits };  
};

export default useGetHabits;