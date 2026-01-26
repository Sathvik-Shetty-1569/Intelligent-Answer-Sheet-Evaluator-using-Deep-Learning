import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBwW8As4m_Gwhacveqs28VkOb7OsjvSUpk",
  authDomain: "intelligent-answer-sheet-74b3b.firebaseapp.com",
  projectId: "intelligent-answer-sheet-74b3b",
  storageBucket: "intelligent-answer-sheet-74b3b.firebasestorage.app",
  messagingSenderId: "270179320480",
  appId: "1:270179320480:web:6ed40c798142895d8bbfc5",
  measurementId: "G-7QG0R2B974"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
