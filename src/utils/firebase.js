import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase, ref, set, push, onValue, get, child, update, increment } from "firebase/database";

import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Initial user setup in DB if needed
        const userRef = ref(db, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            if (!snapshot.exists()) {
                set(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: Date.now(),
                    totalTimePlayed: 0
                });
            } else {
                update(userRef, {
                    lastLogin: Date.now()
                });
            }
        });

        return user;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
};

export const fetchLeaderboard = async () => {
    const scoresRef = ref(db, 'leaderboard');
    const snapshot = await get(scoresRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object to array
        const list = Object.values(data);
        // Sort descending
        list.sort((a, b) => b.score - a.score);
        return list.slice(0, 20);
    }
    return [];
};

export const saveScoreToFirebase = async (user, score, isVerified) => {
    if (!user) return;

    // 1. Fetch current top 20 to check if worthy
    const currentLeaderboard = await fetchLeaderboard();

    // Check if user already has a better score
    const existingEntryIndex = currentLeaderboard.findIndex(e => e.uid === user.uid);
    if (existingEntryIndex !== -1) {
        if (currentLeaderboard[existingEntryIndex].score >= score) {
            console.log("Existing score is higher or equal, skipping save.");
            return; // Don't save if existing score is better
        }
        // If we want to replace the old score, we'd need its key. 
        // But since we pushed with auto-ID, searching by UID in the whole DB is slow without index.
        // For now, allow pushing new high score, relying on fetchLeaderboard to correct it (deduplicate).
        // A better approach is to store by UID as key? No, because we want top 20 globally.
        // OPTIMIZATION: Store scores under `leaderboard/{uid}` so we enforce 1 score per user always.
    }

    const minScore = currentLeaderboard.length < 20 ? 0 : currentLeaderboard[19].score;

    if (score > minScore) {
        // Worthy!
        // We will save to `leaderboard/{uid}` to ensure 1 entry per user
        // This solves duplication automatically.
        const scoreRef = ref(db, 'leaderboard/' + user.uid);

        // We need to check if existing is lower again?
        // Since we are overwriting `leaderboard/{uid}`, we should get it first?
        // Actually, if we use the UID as key, update() or set() will overwrite.
        // But we should only overwrite if new score is higher.

        get(scoreRef).then((snap) => {
            const currentData = snap.val();
            if (!currentData || score > currentData.score) {
                set(scoreRef, {
                    name: user.displayName || "Anonymous",
                    score: score,
                    uid: user.uid, // Redundant if key is uid, but useful
                    verified: isVerified,
                    timestamp: Date.now()
                });
            }
        });

        // Also update User profile highscore
        const userRef = ref(db, 'users/' + user.uid);
        update(userRef, { highScore: score });
    }
};

export const trackSessionTime = (userId, durationMs) => {
    if (!userId || !durationMs) return;
    const userRef = ref(db, 'users/' + userId);
    // Atomic increment
    update(userRef, {
        totalTimePlayed: increment(durationMs)
    });
};

export { auth, db };
