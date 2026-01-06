import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const Home = ({ onStart, leaderboard, isVerified, playerName, onVerified }) => {
    const [inputValue, setInputValue] = useState(playerName);
    const [errorVisible, setErrorVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setInputValue(playerName);
    }, [playerName]);

    const handleStart = () => {
        if (!inputValue.trim()) {
            setErrorVisible(false);
            setTimeout(() => setErrorVisible(true), 10);
            setTimeout(() => setErrorVisible(false), 2000);
            return;
        }
        onStart(inputValue.trim());
    };

    return (
        <div className="main-container">
            <div className={`retro-container ${isVerified ? "verified-status" : ""}`}>
                <h1>ASTEROIDS</h1>

                <div className="home-actions">
                    <div className="input-group">
                        <input
                            type="text"
                            id="username"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={errorVisible ? "NAME REQUIRED" : "ENTER NAME"}
                            className={errorVisible ? "error" : ""}
                            autoComplete="off"
                            onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                        />
                    </div>
                    <button id="start-btn" onClick={handleStart}>
                        START MISSION
                    </button>
                </div>

                <div id="mini-leaderboard">
                    <div className="mini-header">
                        <h3>TOP 5 SPACERS</h3>
                    </div>
                    <div id="mini-leaderboard-list">
                        {leaderboard.length === 0 ? "NO DATA" : leaderboard.map((entry, idx) => (
                            <div key={idx} className="mini-entry">
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
        </div>
    );
};

export default Home;
