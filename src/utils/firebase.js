import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, push, query, orderByChild, limitToLast } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { CONFIG } from './config';

const firebaseConfig = {
    apiKey: CONFIG.FIREBASE_API_KEY,
    authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
    databaseURL: CONFIG.FIREBASE_DATABASE_URL,
    projectId: CONFIG.FIREBASE_PROJECT_ID,
    storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
    appId: CONFIG.FIREBASE_APP_ID,
    measurementId: CONFIG.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

export const recordPlayerActivity = async (name, durationSec) => {
    if (!name) return;
    try {
        const userRef = ref(db, `users/${name.replace(/[.#$[\]]/g, "_")}`);
        const snapshot = await get(userRef);
        const currentData = snapshot.val() || { totalPlayTime: 0, sessions: 0 };

        await set(userRef, {
            name: name,
            totalPlayTime: currentData.totalPlayTime + durationSec,
            sessions: currentData.sessions + 1,
            lastActive: Date.now()
        });
    } catch (error) {
        console.error("Error recording play activity:", error);
    }
};

export const pushToGlobalLeaderboard = async (name, score, isVerified) => {
    try {
        const leaderboardRef = ref(db, 'leaderboard');
        await push(leaderboardRef, {
            name,
            score: parseInt(score),
            verified: isVerified,
            timestamp: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Error pushing to global leaderboard:", error);
        return false;
    }
};

export const subscribeToLeaderboard = (callback) => {
    const leaderboardRef = query(
        ref(db, 'leaderboard'),
        orderByChild('score'),
        limitToLast(50)
    );

    return onValue(leaderboardRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list = Object.values(data).sort((a, b) => b.score - a.score);
            callback(list);
        } else {
            callback([]);
        }
    });
};
