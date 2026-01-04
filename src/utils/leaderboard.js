import { SAVE_KEY_LEADERBOARD } from './constants';

const PB_KEY = 'ASTER_PLAYER_PB';

export const getLeaderboard = () => {
    const data = localStorage.getItem(SAVE_KEY_LEADERBOARD);
    return data ? JSON.parse(data) : [];
};

export const getPersonalBest = () => {
    return parseInt(localStorage.getItem(PB_KEY)) || 0;
};

export const saveToLeaderboard = (name, score, isVerified) => {
    let leaderboard = getLeaderboard();
    let isNewPB = false;

    // Handle Personal Best for verified players
    if (isVerified) {
        const currentPB = getPersonalBest();
        if (score > currentPB) {
            localStorage.setItem(PB_KEY, score.toString());
            isNewPB = true;
        }
    }

    leaderboard.push({
        name,
        score: parseInt(score),
        verified: isVerified,
        timestamp: Date.now()
    });

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 20); // Top 20 only

    localStorage.setItem(SAVE_KEY_LEADERBOARD, JSON.stringify(leaderboard));

    return { leaderboard, isNewPB };
};
