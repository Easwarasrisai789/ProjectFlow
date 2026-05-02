// src/services/chatService.js
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from './firebase';

export const sendMessage = async ({ projectId, senderId, senderName, text }) => {
  await addDoc(collection(db, 'chats'), {
    projectId,
    senderId,
    senderName,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
};

export const subscribeToProjectChat = (projectId, callback) => {
  const q = query(
    collection(db, 'chats'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'asc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
};
