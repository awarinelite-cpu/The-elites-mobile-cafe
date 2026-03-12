// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

// ── All admin emails ─────────────────────────────────────────
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
          // Check email list, Firestore isAdmin, or role
          const isAdmin =
            ADMIN_EMAILS.includes(firebaseUser.email) ||
            data.isAdmin === true ||
            data.role === 'Admin';
          setProfile({
            ...data,
            email: firebaseUser.email,
            isAdmin,
            role: isAdmin ? 'Admin' : (data.role || 'client'),
          });
        } catch {
          const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
          setProfile({
            email: firebaseUser.email,
            isAdmin,
            role: isAdmin ? 'Admin' : 'client',
          });
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
