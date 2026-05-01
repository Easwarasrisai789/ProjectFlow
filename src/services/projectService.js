// src/services/projectService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Create ───────────────────────────────────────────────
export const createProject = async ({ name, description, ownerId, ownerName }) => {
  const ref = await addDoc(collection(db, 'projects'), {
    name,
    description,
    ownerId,
    ownerName,
    memberIds: [ownerId],
    members: [{ uid: ownerId, name: ownerName, role: 'admin' }],
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'users', ownerId), {
    projectIds: arrayUnion(ref.id),
  });

  return ref.id;
};

// ─── Read ─────────────────────────────────────────────────
export const getProject = async (projectId) => {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getUserProjects = async (uid) => {
  // No orderBy — avoids composite index requirement. Sort client-side.
  const q = query(
    collection(db, 'projects'),
    where('memberIds', 'array-contains', uid)
  );
  const snap = await getDocs(q);
  const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort by createdAt descending, client-side
  return projects.sort((a, b) => {
    const ta = a.createdAt?.seconds ?? 0;
    const tb = b.createdAt?.seconds ?? 0;
    return tb - ta;
  });
};

// ─── Update ───────────────────────────────────────────────
export const updateProject = async (projectId, data) => {
  await updateDoc(doc(db, 'projects', projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ─── Delete ───────────────────────────────────────────────
export const deleteProject = async (projectId, memberIds) => {
  const updates = memberIds.map((uid) =>
    updateDoc(doc(db, 'users', uid), { projectIds: arrayRemove(projectId) })
  );
  await Promise.all(updates);
  await deleteDoc(doc(db, 'projects', projectId));
};

// ─── Members ──────────────────────────────────────────────
export const addMemberToProject = async (projectId, member) => {
  await updateDoc(doc(db, 'projects', projectId), {
    memberIds: arrayUnion(member.uid),
    members: arrayUnion(member),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', member.uid), {
    projectIds: arrayUnion(projectId),
  });
};

export const removeMemberFromProject = async (projectId, uid) => {
  const project = await getProject(projectId);
  const updatedMembers = project.members.filter((m) => m.uid !== uid);
  await updateDoc(doc(db, 'projects', projectId), {
    memberIds: arrayRemove(uid),
    members: updatedMembers,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', uid), {
    projectIds: arrayRemove(projectId),
  });
};

// ─── All users (for member search) ───────────────────────
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
