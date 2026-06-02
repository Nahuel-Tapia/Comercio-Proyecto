import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || 'dummy_api_key',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy_auth_domain',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'dummy_project_id',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy_storage_bucket',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'dummy_sender_id',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || 'dummy_app_id',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
