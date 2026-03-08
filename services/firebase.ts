
import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzo3SlOvb2hDEn4d8sfLBiRsCX3WkXo0c",
  authDomain: "a1toque-2601f.firebaseapp.com",
  projectId: "a1toque-2601f",
  storageBucket: "a1toque-2601f.firebasestorage.app",
  messagingSenderId: "359086338612",
  appId: "1:359086338612:web:44000b5b26e5e97d581061",
  measurementId: "G-H7WFF80ZTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to avoid WebSocket connection issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const storage = getStorage(app);
