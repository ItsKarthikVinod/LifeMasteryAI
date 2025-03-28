import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const useGetTodos = () => {
    const [todoss, setTodoss] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTodos = async () => {
        setLoading(true);
        setError(null);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('No user is logged in');
            }

            const db = getFirestore();
            const todosRef = collection(db, 'todos');
            const q = query(todosRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);

            const userTodos = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setTodoss(userTodos);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    return { todoss, loading, error, fetchTodos };
};

export default useGetTodos;