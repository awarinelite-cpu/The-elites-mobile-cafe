// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// ── Admin emails ────────────────────────────────────────────
const ADMIN_EMAILS = ['awarinelite@gmail.com'];

export const registerUser = async ({ name, email, password }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, 'users', credential.user.uid), {
    uid: credential.user.uid,
    name,
    email,
    role: ADMIN_EMAILS.includes(email) ? 'Admin' : 'client',
    isAdmin: ADMIN_EMAILS.includes(email),
    createdAt: serverTimestamp(),
  });
  return credential.user;
};

export const loginUser = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const logoutUser = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Always grant admin to admin emails regardless of Firestore value
  if (ADMIN_EMAILS.includes(data.email)) {
    return { ...data, isAdmin: true, role: 'Admin' };
  }
  return data;
};
