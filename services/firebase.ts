
import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase, ref, set, get, push,
  onValue, off, update, onDisconnect, remove
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCuJYx3QpQrZC3p0Ac-lLuOhcMTWELh4DE",
  authDomain: "moviezz-8395c.firebaseapp.com",
  databaseURL: "https://moviezz-8395c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "moviezz-8395c",
  storageBucket: "moviezz-8395c.firebasestorage.app",
  messagingSenderId: "478621041995",
  appId: "1:478621041995:web:cb63f087063d12c78c54ce",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// ── Types ───────────────────────────────────────────────
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
}

export interface MemberData {
  name: string;
  emoji: string;
  isHost: boolean;
  lastSeen: number;
}

export interface ChatMessage {
  uid: string;
  name: string;
  emoji: string;
  text: string;
  ts: number;
  type?: 'system' | 'chat';
}

export interface RoomData {
  movieSlug: string;
  movieName: string;
  movieThumb: string;
  episodeSlug: string;
  episodeName: string;
  serverIndex: number;
  hostId: string;
  hostName: string;
  hostEmoji: string;
  isPublic: boolean;
  playback: PlaybackState;
  members: Record<string, MemberData>;
  createdAt: number;
  lastActive: number;
}

// Lightweight public index entry (separate node, no full room data)
export interface PublicRoomEntry {
  roomId: string;
  movieName: string;
  movieThumb: string;
  episodeName: string;
  hostName: string;
  hostEmoji: string;
  memberCount: number;
  lastActive: number;
  createdAt: number;
}

// ── Helpers ─────────────────────────────────────────────
const EMOJIS = ['🦊','🐼','🐸','🦁','🐯','🐻','🦄','🐺','🐨','🦅','🐬','🦋','🐙','🐧','🦖'];

export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const generateUserId = (): string => Math.random().toString(36).substring(2, 12);

export const getRandomEmoji = (): string => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

// ── Local user persistence ────────────────────────────────
export interface LocalUser { id: string; name: string; emoji: string; }

export const getLocalUser = (): LocalUser | null => {
  try {
    const saved = localStorage.getItem('wt_user');
    if (saved) return JSON.parse(saved) as LocalUser;
  } catch {}
  return null;
};

export const saveLocalUser = (user: LocalUser): void => {
  localStorage.setItem('wt_user', JSON.stringify(user));
};

// ── Room CRUD ────────────────────────────────────────────
export const createRoom = async (roomId: string, data: Omit<RoomData, 'createdAt'>): Promise<void> => {
  await set(ref(db, `rooms/${roomId}`), { ...data, createdAt: Date.now() });
};

export const getRoom = async (roomId: string): Promise<RoomData | null> => {
  const snap = await get(ref(db, `rooms/${roomId}`));
  return snap.val();
};

export const removeRoom = async (roomId: string): Promise<void> => {
  await remove(ref(db, `rooms/${roomId}`));
};

// ── Members ──────────────────────────────────────────────
export const joinRoom = async (roomId: string, userId: string, member: MemberData): Promise<void> => {
  const memberRef = ref(db, `rooms/${roomId}/members/${userId}`);
  await set(memberRef, member);
  onDisconnect(memberRef).remove();
};

export const updateLastSeen = (roomId: string, userId: string): void => {
  update(ref(db, `rooms/${roomId}/members/${userId}`), { lastSeen: Date.now() }).catch(() => {});
};

// ── Playback ─────────────────────────────────────────────
export const updatePlayback = async (roomId: string, state: PlaybackState): Promise<void> => {
  await update(ref(db, `rooms/${roomId}/playback`), state);
};

export const updateEpisode = async (
  roomId: string, episodeSlug: string, episodeName: string, serverIndex: number
): Promise<void> => {
  await update(ref(db, `rooms/${roomId}`), { episodeSlug, episodeName, serverIndex });
};

// ── Chat ─────────────────────────────────────────────────
export const sendChat = async (roomId: string, msg: ChatMessage): Promise<void> => {
  await push(ref(db, `rooms/${roomId}/chat`), msg);
};

// ── Listeners ────────────────────────────────────────────
export const listenRoom = (roomId: string, cb: (data: RoomData | null) => void): (() => void) => {
  const r = ref(db, `rooms/${roomId}`);
  onValue(r, snap => cb(snap.val()));
  return () => off(r);
};

export const listenChat = (
  roomId: string, cb: (msgs: [string, ChatMessage][]) => void
): (() => void) => {
  const r = ref(db, `rooms/${roomId}/chat`);
  onValue(r, snap => {
    const val = snap.val();
    cb(val ? (Object.entries(val) as [string, ChatMessage][]) : []);
  });
  return () => off(r);
};

// ── Public rooms index ────────────────────────────────────
export const upsertPublicRoom = async (roomId: string, entry: Omit<PublicRoomEntry, 'roomId'>): Promise<void> => {
  await set(ref(db, `public_rooms/${roomId}`), { ...entry, roomId });
};

export const removePublicRoom = async (roomId: string): Promise<void> => {
  await remove(ref(db, `public_rooms/${roomId}`));
};

export const setRoomVisibility = async (
  roomId: string, isPublic: boolean, entry?: Omit<PublicRoomEntry, 'roomId'>
): Promise<void> => {
  await update(ref(db, `rooms/${roomId}`), { isPublic });
  if (isPublic && entry) {
    await upsertPublicRoom(roomId, entry);
  } else {
    await removePublicRoom(roomId);
  }
};

export const updatePublicRoomActivity = async (
  roomId: string, memberCount: number, episodeName: string
): Promise<void> => {
  await update(ref(db, `public_rooms/${roomId}`), {
    memberCount, episodeName, lastActive: Date.now()
  }).catch(() => {});
};

export const listenPublicRooms = (
  cb: (rooms: PublicRoomEntry[]) => void
): (() => void) => {
  const r = ref(db, 'public_rooms');
  onValue(r, snap => {
    const val = snap.val();
    if (!val) { cb([]); return; }
    const now = Date.now();
    const THIRTY_MIN = 30 * 60 * 1000;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    const active = (Object.values(val) as PublicRoomEntry[])
      .filter(room =>
        // Active in last 30 minutes AND created within 7 days
        (now - room.lastActive < THIRTY_MIN) &&
        (now - room.createdAt < SEVEN_DAYS)
      )
      .sort((a, b) => b.lastActive - a.lastActive);
    cb(active);
  });
  return () => off(r);
};

// Cleanup: remove public_rooms entries older than 7 days (client-side GC)
export const cleanupOldPublicRooms = async (): Promise<void> => {
  try {
    const snap = await get(ref(db, 'public_rooms'));
    const val = snap.val();
    if (!val) return;
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const stale = Object.entries(val as Record<string, PublicRoomEntry>)
      .filter(([, entry]) => now - entry.createdAt > SEVEN_DAYS)
      .map(([id]) => id);
    await Promise.all(stale.map(id => removePublicRoom(id)));
  } catch {
    // Silent - cleanup is best-effort
  }
};
