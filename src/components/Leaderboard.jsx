import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

const Leaderboard = ({ entries, onClose }) => {
    return (
        <div className="retro-container leaderboard-box active">
            <div id="close-leaderboard" onClick={onClose}>
                <X size={24} />
            </div>
            <h2>TOP 20 COMMANDERS</h2>
            <div id="leaderboard-list">
                {(!entries || entries.length === 0) ? (
                    <div className="no-data">NO FLIGHT DATA FOUND</div>
                ) : (
                    entries.slice(0, 20).map((entry, idx) => (
                        <div key={idx} className="leaderboard-entry">
                            <span className="rank-num">#{idx + 1}</span>
                            <span className="rank-name">
                                {entry.name}
                            </span>
                            <span className="rank-score">{entry.score.toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
