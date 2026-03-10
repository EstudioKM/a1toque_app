
import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDzo3SlOvb2hDEn4d8sfLBiRsCX3WkXo0c",
  authDomain: "a1toque-2601f.firebaseapp.com",
  projectId: "a1toque-2601f",
  storageBucket: "a1toque-2601f.firebasestorage.app",
  messagingSenderId: "359086338612",
  appId: "1:359086338612:web:6f00d596852496cb581061",
  measurementId: "G-CN7VGDDXZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firestore with long polling to avoid WebSocket connection issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const storage = getStorage(app);
export const auth = getAuth(app);
export { analytics };
