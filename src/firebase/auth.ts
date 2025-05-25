import {
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseConfig';
import { createUser } from './firestore';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();

// Handle user authentication and save to Firestore
export const handleUserAuthentication = async (userCredential: any) => {
  const user = userCredential.user;

  // Save user to Firestore
  await createUser({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    createdAt: new Date(),
    lastLogin: new Date(),
  });

  return user;
};

// Sign in with Google functionality
export const signInWithGoogle = async () => {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(async () => {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = await handleUserAuthentication(result);
      return {
        success: true,
        user,
        error: null,
      };
    });
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { success: false, user: null, error: "Invalid credential provided. Please try again." };
    }
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};

// Sign in with GitHub functionality
export const signInWithGithub = async () => {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(async () => {
      const result = await signInWithPopup(firebaseAuth, githubProvider);
      const user = await handleUserAuthentication(result);
      return {
        success: true,
        user,
        error: null,
      };
    });
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { success: false, user: null, error: "Invalid credential provided. Please try again." };
    }
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};

// Sign in with Twitter functionality
export const signInWithTwitter = async () => {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(async () => {
      const result = await signInWithPopup(firebaseAuth, twitterProvider);
      const user = await handleUserAuthentication(result);
      return {
        success: true,
        user,
        error: null,
      };
    });
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { success: false, user: null, error: "Invalid credential provided. Please try again." };
    }
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};

// Sign in with email and password
export async function signInWithCredentials(email: string, password: string) {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(async () => {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = await handleUserAuthentication(userCredential);
      return {
        success: true,
        user,
        error: null,
      };
    });
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { success: false, user: null, error: "Invalid credential provided. Please try again." };
    }
    return {
      success: false,
      user: null,
      error: error.message || 'Failed to sign in with email/password',
    };
  }
}

// Sign out functionality
export const firebaseSignOut = async () => {
  try {
    await signOut(firebaseAuth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Auth state observer
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return firebaseAuth.onAuthStateChanged(callback);
};

