import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

const LeaderboardPage = ({ entries }) => {
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <div className="retro-container leaderboard-page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <ChevronLeft size={24} /> BACK
                    </button>
                    <h2>TOP 20 COMMANDERS</h2>
                </div>

                <div id="leaderboard-list">
                    {entries.length === 0 ? "NO DATA" : entries.map((entry, idx) => (
                        <div key={idx} className="leaderboard-entry">
                            <span className="rank-num">#{idx + 1}</span>
                            <span className="rank-name">
                                {entry.name}
                            </span>
                            <span className="rank-score">{entry.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
