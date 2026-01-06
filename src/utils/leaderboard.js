import { SAVE_KEY_LEADERBOARD } from './constants';

const PB_KEY = 'ASTER_PLAYER_PB';

export const getLeaderboard = () => {
    const data = localStorage.getItem(SAVE_KEY_LEADERBOARD);
    return data ? JSON.parse(data) : [];
};

export const getPersonalBest = () => {
    return parseInt(localStorage.getItem(PB_KEY)) || 0;
};

export const saveToLeaderboard = (name, score) => {
    let leaderboard = getLeaderboard();
    let isNewPB = false;

    // Handle Personal Best
    const currentPB = getPersonalBest();
    if (score > currentPB) {
        localStorage.setItem(PB_KEY, score.toString());
        isNewPB = true;
    }

    // Check if user already exists in leaderboard
    const existingIndex = leaderboard.findIndex(entry => entry.name === name);

    if (existingIndex !== -1) {
        // If user exists, only update if new score is higher
        if (parseInt(score) > leaderboard[existingIndex].score) {
            leaderboard[existingIndex].score = parseInt(score);
            leaderboard[existingIndex].timestamp = Date.now();
        }
    } else {
        leaderboard.push({
            name,
            score: parseInt(score),
            timestamp: Date.now()
        });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 20); // Top 20 only

    localStorage.setItem(SAVE_KEY_LEADERBOARD, JSON.stringify(leaderboard));

    return { leaderboard, isNewPB };
};
