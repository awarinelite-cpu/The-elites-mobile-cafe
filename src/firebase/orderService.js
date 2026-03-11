// src/firebase/orderService.js
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './config';

// ── ORDERS ──────────────────────────────────────────────
export const createOrder = async ({ clientId, clientName, clientEmail, topicId, topicTitle, customTopic, details, pages }) => {
  const ref = await addDoc(collection(db, 'orders'), {
    clientId, clientName, clientEmail,
    topicId: topicId || null,
    topicTitle: topicTitle || customTopic,
    customTopic: !topicId,
    details: details || '',
    pages: pages || '',
    status: 'pending',
    paymentStatus: 'unpaid',
    advanceAmount: null,
    finalAmount: null,
    totalAmount: null,
    draftFileUrl: null,
    finalFileUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getOrder = async (orderId) => {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getClientOrders = async (clientId) => {
  const q = query(collection(db, 'orders'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllOrders = async () => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateOrder = async (orderId, data) => {
  await updateDoc(doc(db, 'orders', orderId), { ...data, updatedAt: serverTimestamp() });
};

export const subscribeToOrder = (orderId, callback) =>
  onSnapshot(doc(db, 'orders', orderId), snap => callback({ id: snap.id, ...snap.data() }));

export const subscribeToClientOrders = (clientId, callback) => {
  const q = query(collection(db, 'orders'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const subscribeToAllOrders = (callback) => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ── TOPICS ──────────────────────────────────────────────
export const createTopic = async (data) => {
  const ref = await addDoc(collection(db, 'topics'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const getTopics = async () => {
  const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateTopic = async (id, data) => updateDoc(doc(db, 'topics', id), data);

export const subscribeToTopics = (callback) => {
  const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ── MESSAGES ────────────────────────────────────────────
export const sendMessage = async ({ orderId, senderId, senderName, senderRole, text }) => {
  await addDoc(collection(db, 'messages'), {
    orderId, senderId, senderName, senderRole, text,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToMessages = (orderId, callback) => {
  const q = query(collection(db, 'messages'), where('orderId', '==', orderId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ── QUOTES ──────────────────────────────────────────────
export const sendQuote = async ({ orderId, clientId, advanceAmount, finalAmount, totalAmount, note }) => {
  await addDoc(collection(db, 'quotes'), {
    orderId, clientId, advanceAmount, finalAmount, totalAmount,
    note: note || '', createdAt: serverTimestamp(),
  });
  await updateOrder(orderId, {
    status: 'quoted',
    advanceAmount, finalAmount, totalAmount,
    quoteNote: note || '',
  });
};
