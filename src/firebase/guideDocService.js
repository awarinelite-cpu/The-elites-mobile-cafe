// src/firebase/guideDocService.js
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Firestore documents have a 1MB hard limit — cap stored guide content
// well under that so metadata + content always fits safely.
const MAX_GUIDE_CHARS = 900000;

export const saveGuideDocument = async ({ ownerId, name, content, fileName }) => {
  const trimmed = (content || '').trim();
  const truncated = trimmed.length > MAX_GUIDE_CHARS;
  const ref = await addDoc(collection(db, 'guideDocuments'), {
    ownerId,
    name: (name || fileName || 'Untitled Guide').trim(),
    fileName: fileName || null,
    content: truncated ? trimmed.slice(0, MAX_GUIDE_CHARS) : trimmed,
    truncated,
    wordCount: trimmed.split(/\s+/).filter(Boolean).length,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, truncated };
};

export const listGuideDocuments = async (ownerId) => {
  const q = query(collection(db, 'guideDocuments'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return docs;
};

export const deleteGuideDocument = async (id) => {
  await deleteDoc(doc(db, 'guideDocuments', id));
};
