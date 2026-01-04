import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

const Leaderboard = ({ entries, onClose }) => {
    return (
        <div className="retro-container leaderboard-box active">
            <div id="close-leaderboard" onClick={onClose}>
                <X size={24} />
            </div>
            <h2>TOP 50 COMMANDERS</h2>
            <div id="leaderboard-list">
                {entries.length === 0 ? "NO DATA" : entries.map((entry, idx) => (
                    <div key={idx} className="leaderboard-entry">
                        <span className="rank-num">#{idx + 1}</span>
                        <span className="rank-name">
                            {entry.name}
                            {entry.verified && (
                                <div className="verified-badge" title="Verified User">
                                    <CheckCircle2 size={12} />
                                </div>
                            )}
                        </span>
                        <span className="rank-score">{entry.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
