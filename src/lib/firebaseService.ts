import {
  db,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  arrayUnion
} from './firebase';
import { UserProfile, Intent, ChatMessage, ChatThread, CallSignal } from '../types';

const USERS_COLLECTION = 'users';
const INTENTS_COLLECTION = 'intents';
const MESSAGES_COLLECTION = 'messages';
const THREADS_COLLECTION = 'threads';
const CALLS_COLLECTION = 'calls';

// Helper to strip undefined values so Firestore setDoc doesn't fail
function sanitizeForFirestore(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        clean[key] = sanitizeForFirestore(obj[key]);
      } else {
        clean[key] = obj[key];
      }
    }
  });
  return clean;
}

// 1. Sync User Profile to Firestore
export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    const data = sanitizeForFirestore({
      ...user,
      updatedAt: new Date().toISOString()
    });
    await setDoc(userRef, data, { merge: true });
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
      // Quiet handler for network/DNS drops
    });
  } catch (err) {
    return () => {};
  }
}

// 3. Sync Intent to Firestore
export async function saveIntentToFirestore(intent: Intent): Promise<void> {
  try {
    const intentRef = doc(db, INTENTS_COLLECTION, intent.id);
    const data = sanitizeForFirestore({
      ...intent,
      createdAtIso: new Date().toISOString()
    });
    await setDoc(intentRef, data, { merge: true });
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
      // Sort newest first
      intents.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(intents);
    }, (err) => {
      // Quiet handler for network drops
    });
  } catch (err) {
    return () => {};
  }
}

// 5. Chat Threads Sync & Listener
export async function saveThreadToFirestore(thread: ChatThread): Promise<void> {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, thread.id);
    const data = sanitizeForFirestore({
      ...thread,
      updatedAtIso: new Date().toISOString()
    });
    await setDoc(threadRef, data, { merge: true });
  } catch (err) {
    console.error('Firestore saveThread error:', err);
  }
}

export function subscribeToThreads(currentUserId: string, onUpdate: (threads: ChatThread[]) => void) {
  try {
    const q = query(collection(db, THREADS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const threads: ChatThread[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ChatThread;
        // User is involved if participantId === currentUserId OR createdByUserId === currentUserId
        if (data.participantId === currentUserId || data.createdByUserId === currentUserId) {
          threads.push(data);
        }
      });
      threads.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
      onUpdate(threads);
    }, (err) => {
      // Quiet handler for network drops
    });
  } catch (err) {
    return () => {};
  }
}

// 6. Save Message to Firestore
export async function saveMessageToFirestore(msg: ChatMessage): Promise<void> {
  try {
    const msgRef = doc(db, MESSAGES_COLLECTION, msg.id);
    const data = sanitizeForFirestore({
      ...msg,
      createdAtIso: new Date().toISOString()
    });
    await setDoc(msgRef, data, { merge: true });
  } catch (err) {
    console.error('Firestore saveMessage error:', err);
  }
}

// Delete Single Chat Message from Firestore
export async function deleteMessageFromFirestore(messageId: string): Promise<void> {
  try {
    const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
    await deleteDoc(msgRef);
  } catch (err) {
    console.error('Firestore deleteMessage error:', err);
  }
}

// Delete Chat Thread & all its messages from Firestore
export async function deleteThreadFromFirestore(threadId: string): Promise<void> {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await deleteDoc(threadRef);
  } catch (err) {
    console.error('Firestore deleteThread error:', err);
  }
}

// Real-time Chat Messages Listener for Threads
export function subscribeToAllMessages(onUpdate: (messagesMap: Record<string, ChatMessage[]>) => void) {
  try {
    const q = query(collection(db, MESSAGES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const map: Record<string, ChatMessage[]> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ChatMessage;
        if (data.threadId) {
          if (!map[data.threadId]) map[data.threadId] = [];
          map[data.threadId].push(data);
        }
      });
      Object.keys(map).forEach(tid => {
        map[tid].sort((a, b) => a.timestamp - b.timestamp);
      });
      onUpdate(map);
    }, (err) => {
      // Quiet handler for network drops
    });
  } catch (err) {
    return () => {};
  }
}

// 7. Call Signals (Real-time WebRTC & Voice Calling)
export async function saveCallSignalToFirestore(call: CallSignal): Promise<void> {
  try {
    const callRef = doc(db, CALLS_COLLECTION, call.id);
    const data = sanitizeForFirestore({
      ...call,
      updatedAtIso: new Date().toISOString()
    });
    await setDoc(callRef, data, { merge: true });
  } catch (err) {
    console.error('Firestore saveCallSignal error:', err);
  }
}

export function subscribeToCalls(
  currentUserId: string,
  currentUserName: string | undefined,
  onUpdate: (activeCalls: CallSignal[]) => void
) {
  try {
    const q = query(collection(db, CALLS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const calls: CallSignal[] = [];
      const now = Date.now();
      const cName = (currentUserName || '').toLowerCase();
      const cId = (currentUserId || '').toLowerCase();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CallSignal;
        // Ignore calls older than 1 hour
        if (data.createdAt && (now - data.createdAt > 3600000)) return;

        const callerId = (data.callerId || '').toLowerCase();
        const receiverId = (data.receiverId || '').toLowerCase();
        const callerName = (data.callerName || '').toLowerCase();
        const receiverName = (data.receiverName || '').toLowerCase();

        const matchesUser =
          (cId !== '' && (callerId === cId || receiverId === cId)) ||
          (cName !== '' && (callerName === cName || receiverName === cName));

        if (matchesUser) {
          calls.push(data);
        }
      });
      onUpdate(calls);
    }, (err) => {
      // Quiet handler for network drops
    });
  } catch (err) {
    return () => {};
  }
}

export async function updateCallSignalInFirestore(callId: string, updates: Partial<CallSignal>): Promise<void> {
  try {
    const callRef = doc(db, CALLS_COLLECTION, callId);
    const data = sanitizeForFirestore({
      ...updates,
      updatedAtIso: new Date().toISOString()
    });
    await setDoc(callRef, data, { merge: true });
  } catch (err) {
    console.error('Firestore updateCallSignal error:', err);
  }
}

export async function deleteCallSignalFromFirestore(callId: string): Promise<void> {
  try {
    const callRef = doc(db, CALLS_COLLECTION, callId);
    await deleteDoc(callRef);
  } catch (err) {
    console.error('Firestore deleteCallSignal error:', err);
  }
}

export async function addIceCandidateToFirestore(callId: string, role: 'caller' | 'receiver', candidateJson: string): Promise<void> {
  try {
    const callRef = doc(db, CALLS_COLLECTION, callId);
    const field = role === 'caller' ? 'callerIceCandidates' : 'receiverIceCandidates';
    await updateDoc(callRef, {
      [field]: arrayUnion(candidateJson),
      updatedAtIso: new Date().toISOString()
    });
  } catch (err) {
    try {
      const callRef = doc(db, CALLS_COLLECTION, callId);
      const field = role === 'caller' ? 'callerIceCandidates' : 'receiverIceCandidates';
      const snap = await getDoc(callRef);
      if (snap.exists()) {
        const existing = snap.data()[field] || [];
        if (!existing.includes(candidateJson)) {
          await setDoc(callRef, { [field]: [...existing, candidateJson] }, { merge: true });
        }
      } else {
        await setDoc(callRef, { [field]: [candidateJson] }, { merge: true });
      }
    } catch (e) {
      console.error('addIceCandidateToFirestore error:', e);
    }
  }
}
