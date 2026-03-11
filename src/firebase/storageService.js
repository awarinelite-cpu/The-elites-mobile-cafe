// src/firebase/storageService.js
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = (path, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      snap => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
    );
  });
};

export const uploadDraft = (orderId, file, onProgress) =>
  uploadFile(`orders/${orderId}/draft/${file.name}`, file, onProgress);

export const uploadFinal = (orderId, file, onProgress) =>
  uploadFile(`orders/${orderId}/final/${file.name}`, file, onProgress);

export const uploadTopicFile = (topicId, file, onProgress) =>
  uploadFile(`topics/${topicId}/${file.name}`, file, onProgress);

export const deleteFile = async (url) => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (e) { console.error('Delete failed', e); }
};
