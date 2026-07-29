import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  addDoc
} from './firebase';
import { UserProfile, Intent, ChatMessage } from '../types';

const USERS_COLLECTION = 'users';
const INTENTS_COLLECTION = 'intents';
const MESSAGES_COLLECTION = 'messages';

// 1. Sync User Profile to Firestore
export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Firestore saveUser error:', err);
  }
}

// Delete User Profile from Firestore
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
  } catch (err) {
    console.error('Firestore deleteUser error:', err);
  }
}

// Check Firestore for duplicate phone number or government ID
export async function checkDuplicateUserInFirestore(phoneNumber?: string, governmentId?: string): Promise<string | null> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";
    const cleanGovId = governmentId ? governmentId.trim().toUpperCase() : "";

    for (const docSnap of snapshot.docs) {
      const u = docSnap.data() as UserProfile;
      if (cleanPhone && cleanPhone.length >= 5 && u.phoneNumber) {
        const uCleanPhone = u.phoneNumber.replace(/\D/g, "");
        if (uCleanPhone === cleanPhone) {
          return `An account (${u.name}) is already registered with phone number ${phoneNumber}. One person cannot create multiple accounts with the same phone number.`;
        }
      }
      if (cleanGovId && u.governmentId) {
        const uCleanGovId = u.governmentId.trim().toUpperCase();
        if (uCleanGovId === cleanGovId) {
          return `An account (${u.name}) is already registered with Government ID ${governmentId}. One person cannot create multiple accounts with the same Government ID.`;
        }
      }
    }
  } catch (err) {
    console.warn('Firestore checkDuplicateUser error:', err);
  }
  return null;
}

// 2. Real-time Users Listener
export function subscribeToUsers(onUpdate: (users: UserProfile[]) => void) {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      if (users.length > 0) {
        onUpdate(users);
      }
    }, (err) => {
      console.warn('Firestore subscribeToUsers error:', err);
    });
  } catch (err) {
    console.error('Firestore subscribeToUsers init error:', err);
    return () => {};
  }
}

// 3. Sync Intent to Firestore
export async function saveIntentToFirestore(intent: Intent): Promise<void> {
  try {
    const intentRef = doc(db, INTENTS_COLLECTION, intent.id);
    await setDoc(intentRef, {
      ...intent,
      createdAtIso: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Firestore saveIntent error:', err);
  }
}

// Delete Intent from Firestore
export async function deleteIntentFromFirestore(intentId: string): Promise<void> {
  try {
    const intentRef = doc(db, INTENTS_COLLECTION, intentId);
    await deleteDoc(intentRef);
  } catch (err) {
    console.error('Firestore deleteIntent error:', err);
  }
}

// 4. Real-time Intents Listener
export function subscribeToIntents(onUpdate: (intents: Intent[]) => void) {
  try {
    const q = query(collection(db, INTENTS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const intents: Intent[] = [];
      snapshot.forEach((docSnap) => {
        intents.push(docSnap.data() as Intent);
      });
      onUpdate(intents);
    }, (err) => {
      console.warn('Firestore subscribeToIntents error:', err);
    });
  } catch (err) {
    console.error('Firestore subscribeToIntents init error:', err);
    return () => {};
  }
}

// 5. Save Message to Firestore
export async function saveMessageToFirestore(intentId: string, msg: ChatMessage): Promise<void> {
  try {
    const msgRef = doc(db, MESSAGES_COLLECTION, msg.id);
    await setDoc(msgRef, {
      ...msg,
      intentId,
      createdAtIso: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Firestore saveMessage error:', err);
  }
}

// 6. Real-time Chat Messages Listener for an Intent
export function subscribeToMessages(intentId: string, onUpdate: (messages: ChatMessage[]) => void) {
  try {
    const q = query(collection(db, MESSAGES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.intentId === intentId) {
          msgs.push(data as ChatMessage);
        }
      });
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      onUpdate(msgs);
    }, (err) => {
      console.warn('Firestore subscribeToMessages error:', err);
    });
  } catch (err) {
    console.error('Firestore subscribeToMessages init error:', err);
    return () => {};
  }
}
