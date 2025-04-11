import { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const useGetJournalEntries = () => {
    const [journalEntries, setFetchedJournalEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const db = getFirestore();

    const fetchJournalEntries = useCallback ( async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not logged in');
            }

            
            const journalEntriesRef = collection(db, 'journalEntries');
            const q = query(journalEntriesRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);

            const journalEntriesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setFetchedJournalEntries(journalEntriesData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    },[db]);

    const deleteJournalEntry = async (id) => {
        try {
          const journalRef = doc(db, 'journalEntries', id);
          await deleteDoc(journalRef);
          fetchJournalEntries();
        } catch (error) {
          console.error('Error deleting journal: ', error);
        }
      };

    useEffect(() => {
        fetchJournalEntries();
    },[fetchJournalEntries]);

    return { journalEntries, loading, error, fetchJournalEntries, deleteJournalEntry };  
};

export default useGetJournalEntries;