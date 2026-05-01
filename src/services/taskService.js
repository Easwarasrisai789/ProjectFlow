// src/services/taskService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Create ───────────────────────────────────────────────
export const createTask = async ({
  projectId, title, description, assigneeId, assigneeName,
  priority, dueDate, createdBy, createdByName, taskNumber,
}) => {
  const ref = await addDoc(collection(db, 'tasks'), {
    projectId,
    title,
    description: description || '',
    assigneeId: assigneeId || null,
    assigneeName: assigneeName || null,
    priority: priority || 'medium',
    status: 'todo',
    dueDate: dueDate || null,
    taskNumber: taskNumber || null,
    createdBy,
    createdByName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
};

// ─── Read ─────────────────────────────────────────────────
export const getProjectTasks = async (projectId) => {
  const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return tasks.sort((a, b) => (a.taskNumber || a.createdAt?.seconds || 0) - (b.taskNumber || b.createdAt?.seconds || 0));
};

export const getUserTasks = async (uid) => {
  const q = query(collection(db, 'tasks'), where('assigneeId', '==', uid));
  const snap = await getDocs(q);
  const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return tasks.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
};

export const getAllTasksForProjects = async (projectIds) => {
  if (!projectIds.length) return [];
  const chunks = chunkArray(projectIds, 10);
  const results = await Promise.all(
    chunks.map((chunk) => getDocs(query(collection(db, 'tasks'), where('projectId', 'in', chunk))))
  );
  return results.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};

// ─── Update ───────────────────────────────────────────────
export const updateTask = async (taskId, data) => {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (data.status === 'done' && !data.completedAt) {
    payload.completedAt = serverTimestamp();
  } else if (data.status && data.status !== 'done') {
    payload.completedAt = null;
  }
  await updateDoc(doc(db, 'tasks', taskId), payload);
};

export const updateTaskStatus = async (taskId, status) => updateTask(taskId, { status });

// ─── Delete ───────────────────────────────────────────────
export const deleteTask = async (taskId) => deleteDoc(doc(db, 'tasks', taskId));

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};
