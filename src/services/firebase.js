// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyApYxZAnjIcpu97lz5CRjSuF6BH2xHMCiA',
  authDomain: 'taskassign-b7500.firebaseapp.com',
  projectId: 'taskassign-b7500',
  storageBucket: 'taskassign-b7500.firebasestorage.app',
  messagingSenderId: '164912689031',
  appId: '1:164912689031:web:f92ac752a3c14bdc16ad22',
  measurementId: 'G-QSDHK60NR3',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
