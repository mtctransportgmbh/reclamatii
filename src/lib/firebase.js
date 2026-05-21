// ============================================================
// ÎNLOCUIEȘTE ACEST OBIECT CU DATELE TALE DIN FIREBASE CONSOLE
// Project Settings → Your apps → firebaseConfig
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAUju0UiaAlTCjLgs0IZf01A65iiqpHZhI",
  authDomain: "reclamatii-df0e7.firebaseapp.com",
  projectId: "reclamatii-df0e7",
  storageBucket: "reclamatii-df0e7.firebasestorage.app",
  messagingSenderId: "231511007803",
  appId: "1:231511007803:web:04b08affe925e6ef37f21e"
};

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
