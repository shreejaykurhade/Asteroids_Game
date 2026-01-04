import { SAVE_KEY_LEADERBOARD } from './constants';

export const getLeaderboard = () => {
    const data = localStorage.getItem(SAVE_KEY_LEADERBOARD);
    return data ? JSON.parse(data) : [];
};

export const saveToLeaderboard = (name, score, isVerified) => {
    let leaderboard = getLeaderboard();
    leaderboard.push({ name, score, verified: isVerified });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 50);
    localStorage.setItem(SAVE_KEY_LEADERBOARD, JSON.stringify(leaderboard));
    return leaderboard;
};
