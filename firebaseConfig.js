import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC992uaVZTeUaCFiyiwm_M3QE2Vkkj1Fr0",
  authDomain: "aianswerevaluator.firebaseapp.com",
  projectId: "aianswerevaluator",
  storageBucket: "aianswerevaluator.firebasestorage.com",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "1:1065584546582:android:c1a0cb00d70df89107f637"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
