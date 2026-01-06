import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CONFIG } from '../utils/config';

const StartScreen = ({ onStart, leaderboard, playerName }) => {
    const [inputValue, setInputValue] = useState(playerName);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
        setInputValue(playerName);
    }, [playerName]);

    const handleStart = () => {
        if (!inputValue.trim()) {
            setErrorVisible(true);
            setTimeout(() => setErrorVisible(false), 2000);
            return;
        }
        onStart(inputValue.trim());
    };

    return (
        <div id="ui-overlay">
            <div className="main-container">
                <div className="retro-container">
                    <h1>ASTEROIDS</h1>
                    <input
                        type="text"
                        id="username"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={errorVisible ? "NAME REQUIRED" : "ENTER NAME"}
                        style={{ borderColor: errorVisible ? "red" : "white" }}
                        onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                    />

                    <button id="start-btn" onClick={handleStart}>
                        START MISSION
                    </button>

                    <div id="mini-leaderboard">
                        <h3>TOP 5 SPACERS</h3>
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
        </div>
    );
};

export default StartScreen;
