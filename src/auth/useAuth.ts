import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';

export type Role = 'employee' | 'boss';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ uid: firebaseUser.uid, ...userSnap.data() } as AppUser);
        } else {
          // Check if this is the first user
          const usersQuery = query(collection(db, 'users'), limit(1));
          const usersSnap = await getDocs(usersQuery);
          const isFirstUser = usersSnap.empty;
          
          const newUser: Omit<AppUser, 'uid'> = {
            name: firebaseUser.displayName || 'Unknown',
            email: firebaseUser.email || '',
            role: isFirstUser ? 'boss' : 'employee',
          };
          await setDoc(userRef, newUser);
          setUser({ uid: firebaseUser.uid, ...newUser });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleRole = async () => {
    if (!user) return;
    const newRole = user.role === 'boss' ? 'employee' : 'boss';
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { role: newRole });
    setUser({ ...user, role: newRole });
  };

  return { user, loading, toggleRole };
}
