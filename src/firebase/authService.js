// src/firebase/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const ADMIN_EMAILS = ['awarinelite@gmail.com', 'admin@elitesmobilecafe.com'];

export const registerUser = async ({ name, email, password, role = 'client', referredBy = null }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  const isAdmin  = ADMIN_EMAILS.includes(email);
  const userRole = isAdmin ? 'Admin' : role; // client | writer | Admin
  await setDoc(doc(db, 'users', credential.user.uid), {
    uid:        credential.user.uid,
    name,
    email,
    role:       userRole,
    isAdmin,
    isWriter:   userRole === 'writer',
    referredBy: referredBy || null,   // writer uid or 'admin' that referred this user
    createdAt:  serverTimestamp(),
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
  const isAdmin = ADMIN_EMAILS.includes(data.email) || data.isAdmin === true || data.role === 'Admin';
  return { ...data, isAdmin, role: isAdmin ? 'Admin' : (data.role || 'client') };
};
