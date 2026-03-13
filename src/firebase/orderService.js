// src/firebase/orderService.js
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './config';

// ── ORDERS ──────────────────────────────────────────────
// NOTE: All service requests are stored in 'serviceRequests' collection.
// The old 'orders' collection is unused. All queries now target 'serviceRequests'.

export const createOrder = async ({
  clientId, clientName, clientEmail,
  topicId, topicTitle, customTopic,
  details, pages, serviceKey, serviceTitle, referredBy,
}) => {
  const ref = await addDoc(collection(db, 'serviceRequests'), {
    userId:      clientId,        // DashboardPage reads as userId
    clientId,                     // keep for backwards compat
    name:        clientName,
    email:       clientEmail,
    serviceKey:  serviceKey  || topicId   || null,
    serviceTitle: serviceTitle || topicTitle || customTopic,
    topicId:     topicId   || null,
    topicTitle:  topicTitle || customTopic || '',
    customTopic: !topicId,
    details:     details  || '',
    description: details  || '',  // AdminPage reads 'description'
    pages:       pages    || '',
    status:      'pending',
    paymentStatus: 'not_set',
    advanceAmount:  null,
    finalAmount:    null,
    totalAmount:    null,
    agreedPrice:    null,
    adminNote:      '',
    referredBy:     referredBy || null,
    draftFileUrl:   null,
    finalFileUrl:   null,
    createdAt:      serverTimestamp(),
    updatedAt:      serverTimestamp(),
  });
  return ref.id;
};

export const getOrder = async (orderId) => {
  const snap = await getDoc(doc(db, 'serviceRequests', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getClientOrders = async (clientId) => {
  // Try userId field first (written by ServiceRequestPage)
  const q = query(
    collection(db, 'serviceRequests'),
    where('userId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllOrders = async () => {
  const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateOrder = async (orderId, data) => {
  await updateDoc(doc(db, 'serviceRequests', orderId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const subscribeToOrder = (orderId, callback) =>
  onSnapshot(
    doc(db, 'serviceRequests', orderId),
    snap => callback({ id: snap.id, ...snap.data() })
  );

// ── KEY FIX: was querying 'orders' with 'clientId' field.
//    ServiceRequestPage writes to 'serviceRequests' with field 'userId'.
export const subscribeToClientOrders = (clientId, callback) => {
  const q = query(
    collection(db, 'serviceRequests'),
    where('userId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const subscribeToAllOrders = (callback) => {
  const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ── TOPICS ──────────────────────────────────────────────
export const createTopic = async (data) => {
  const ref = await addDoc(collection(db, 'researchTopics'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getTopics = async () => {
  const q = query(collection(db, 'researchTopics'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateTopic = async (id, data) =>
  updateDoc(doc(db, 'researchTopics', id), data);

export const subscribeToTopics = (callback) => {
  const q = query(collection(db, 'researchTopics'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ── MESSAGES ────────────────────────────────────────────
// Per-user thread: adminMessages/{userId}/messages  (used by Dashboard + Admin)
export const sendMessage = async ({ userId, senderId, senderName, senderRole, text }) => {
  await addDoc(collection(db, 'adminMessages', userId, 'messages'), {
    sender:     senderRole === 'admin' ? 'admin' : 'client',
    senderName: senderName || senderRole,
    type:       'text',
    text,
    createdAt:  serverTimestamp(),
  });
};

export const subscribeToMessages = (userId, callback) => {
  const q = query(
    collection(db, 'adminMessages', userId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ── QUOTES (legacy, kept for compatibility) ──────────────
export const sendQuote = async ({
  orderId, clientId, advanceAmount, finalAmount, totalAmount, note,
}) => {
  await addDoc(collection(db, 'quotes'), {
    orderId, clientId,
    advanceAmount, finalAmount, totalAmount,
    note: note || '',
    createdAt: serverTimestamp(),
  });
  await updateOrder(orderId, {
    status: 'quoted',
    advanceAmount, finalAmount, totalAmount,
    quoteNote: note || '',
  });
};
