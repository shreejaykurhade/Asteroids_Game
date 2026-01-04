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

export const saveScoreToFirebase = (user, score, isVerified) => {
    if (!user) return;

    // Global Leaderboard
    const scoresRef = ref(db, 'leaderboard');
    const newScoreRef = push(scoresRef);
    set(newScoreRef, {
        name: user.displayName || "Anonymous",
        score: score,
        uid: user.uid,
        verified: isVerified,
        timestamp: Date.now()
    });

    // Update PB
    const userRef = ref(db, 'users/' + user.uid);
    get(child(userRef, 'highScore')).then((snapshot) => {
        const currentHigh = snapshot.val() || 0;
        if (score > currentHigh) {
            update(userRef, { highScore: score });
        }
    });
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
