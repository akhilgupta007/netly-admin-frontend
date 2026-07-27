import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  collectionGroup,
  Timestamp 
} from "firebase/firestore";

// Helper to get non-empty env var or fallback
const getEnv = (val, fallback) => (val && val.trim() ? val.trim() : fallback);

// Firebase configuration from environment variables or sensible fallbacks
const firebaseConfig = {
  apiKey: getEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "AIzaSyDemoConfigKeyForNetlyAdminApp"),
  authDomain: getEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "netly-admin.firebaseapp.com"),
  projectId: getEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "netly-admin"),
  storageBucket: getEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "netly-admin.appspot.com"),
  messagingSenderId: getEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "1234567890"),
  appId: getEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "1:1234567890:web:abcdef123456")
};

// Check if project credentials have been configured in .env.local
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim() &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim()
);

import { getFunctions, httpsCallable } from "firebase/functions";

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

console.log("🔥 Firebase Client SDK initialized on project:", firebaseConfig.projectId, "Configured:", isFirebaseConfigured);

export { 
  app, 
  db, 
  auth,
  functions,
  httpsCallable,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  collectionGroup,
  Timestamp 
};
