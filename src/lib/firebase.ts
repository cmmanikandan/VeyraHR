import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuPv99f6i2qZ5CWaSDcVtlEwwHpTQ1cZ4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "emp-track-c0436.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "emp-track-c0436",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "emp-track-c0436.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "377671303827",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:377671303827:web:773950afbc4a0330ebc366",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PXQS762QT7"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Creates a new Firebase Auth account for a newly provisioned employee or HR manager
 * without switching the active session of the current logged-in user.
 */
export const registerFirebaseUser = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<{ uid: string; email: string } | null> => {
  try {
    let secondaryApp = getApps().find(a => a.name === 'SecondaryEmployeeAuth');
    if (!secondaryApp) {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryEmployeeAuth');
    }
    const secondaryAuth = getAuth(secondaryApp);
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    
    if (displayName && userCred.user) {
      try {
        await updateProfile(userCred.user, { displayName });
      } catch (pErr) {
        console.warn('Profile name update notice:', pErr);
      }
    }
    
    const userUid = userCred.user.uid;
    // Sign out secondary auth instance immediately to avoid keeping state
    await secondaryAuth.signOut();
    return { uid: userUid, email: email.trim() };
  } catch (err: any) {
    console.warn('Firebase user provisioning notice:', err.code, err.message);
    return null;
  }
};

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  firebaseSignOut,
  onAuthStateChanged 
};
export type { User };
