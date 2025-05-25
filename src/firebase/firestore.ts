import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, DocumentData, CollectionReference, Timestamp } from 'firebase/firestore';
import app from './firebaseConfig';

// Initialize Firestore
export const db = getFirestore(app);

// Helper function to create a typed collection reference
export function createCollection<T extends DocumentData>(collectionName: string) {
  return collection(db, collectionName) as CollectionReference<T>;
}

// Define types for your collections
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
}

// Create typed collections
export const usersCollection = createCollection<User>('users');

// Helper functions for users collection
export async function createUser(userData: User): Promise<void> {
  const userRef = doc(usersCollection, userData.uid);
  await setDoc(userRef, userData);
}

export async function getUserById(uid: string): Promise<User | null> {
  const userRef = doc(usersCollection, uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(usersCollection, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  } else {
    return null;
  }
}

// Define SpellCheck interface
export interface SpellCheck {
  corrected_string?: string[];
  expire?: Timestamp;
  created_at?: Timestamp;
  id?: string;
  original_string: string;
  without_errors: boolean;
  owner_uid?: string;
  language: string;
  shared?: boolean;
  user_email?: string;
  user_uid?: string;
  user_name?: string;
}

// Create typed collection for "checks"
export const checksCollection = createCollection<SpellCheck>('checks');

// Helper function to get all checks
export async function getAllChecks(): Promise<SpellCheck[]> {
  const querySnapshot = await getDocs(checksCollection);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as SpellCheck));
}

// Helper function to get shared checks grouped by expiration time
export async function getExpiringChecks() {
  const now = Timestamp.now();
  const weekFromNow = Timestamp.fromDate(new Date(now.toDate().getTime() + 7 * 24 * 60 * 60 * 1000));

  // Get all shared checks
  const sharedQuery = query(checksCollection, where("shared", "==", true));
  
  // Get expiring shared checks
  const expiringQuery = query(
    checksCollection,
    where("shared", "==", true),
    where("expire", ">=", now),
    where("expire", "<=", weekFromNow)
  );

  const [sharedSnapshot, expiringSnapshot] = await Promise.all([
    getDocs(sharedQuery),
    getDocs(expiringQuery)
  ]);

  const hourFromNow = new Date(now.toDate().getTime() + 60 * 60 * 1000);
  const dayFromNow = new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000);

  // Group the checks by expiration time
  const result = {
    expiringInHour: [] as typeof expiringSnapshot.docs,
    expiringInDay: [] as typeof expiringSnapshot.docs,
    expiringInWeek: [] as typeof expiringSnapshot.docs,
    totalShared: sharedSnapshot.size
  };

  expiringSnapshot.docs.forEach(doc => {
    const expireDate = doc.data().expire?.toDate();
    if (!expireDate) return;

    if (expireDate <= hourFromNow) {
      result.expiringInHour.push(doc);
    } else if (expireDate <= dayFromNow) {
      result.expiringInDay.push(doc);
    } else {
      result.expiringInWeek.push(doc);
    }
  });

  return result;
}

