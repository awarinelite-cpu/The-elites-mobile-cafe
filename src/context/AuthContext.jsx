// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

const ADMIN_EMAILS = ['awarinelite@gmail.com', 'admin@elitesmobilecafe.com'];

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          const data = snap.exists() ? snap.data() : {};
          const isAdmin  = ADMIN_EMAILS.includes(firebaseUser.email) || data.isAdmin === true || data.role === 'Admin';
          const isWriter = !isAdmin && (data.isWriter === true || data.role === 'writer');
          setProfile({
            ...data,
            email: firebaseUser.email,
            isAdmin,
            isWriter,
            role: isAdmin ? 'Admin' : isWriter ? 'writer' : (data.role || 'client'),
          });
        } catch {
          const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
          setProfile({ email: firebaseUser.email, isAdmin, isWriter: false, role: isAdmin ? 'Admin' : 'client' });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
