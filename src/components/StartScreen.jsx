import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CONFIG } from '../utils/config';

const StartScreen = ({ onStart, leaderboard, isVerified, playerName, onVerified }) => {
    const [inputValue, setInputValue] = useState(playerName);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
        setInputValue(playerName);
    }, [playerName]);

    useEffect(() => {
        // Initialize Google Sign-In
        const initGoogle = () => {
            if (!window.google) {
                setTimeout(initGoogle, 100);
                return;
            }

            window.google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: (response) => {
                    const payload = JSON.parse(atob(response.credential.split('.')[1]));
                    onVerified(payload.name.toUpperCase());
                }
            });

            const target = document.getElementById("g_id_signin");
            if (target) {
                window.google.accounts.id.renderButton(target, {
                    theme: "outline",
                    size: "large",
                    shape: "rectangular"
                });
            }
        };

        initGoogle();
    }, [onVerified]);

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
                        onChange={(e) => !isVerified && setInputValue(e.target.value)}
                        disabled={isVerified}
                        placeholder={errorVisible ? "NAME REQUIRED" : (isVerified ? "VERIFIED" : "ENTER NAME")}
                        style={{ borderColor: errorVisible ? "red" : "white" }}
                        onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                    />

                    <button id="start-btn" onClick={handleStart}>
                        START MISSION
                    </button>

                    {!isVerified && (
                        <div id="google-signin-container">
                            <div id="g_id_signin"></div>
                        </div>
                    )}

                    <div id="mini-leaderboard">
                        <h3>TOP 5 SPACERS</h3>
                        <div id="mini-leaderboard-list">
                            {leaderboard.length === 0 ? "NO DATA" : leaderboard.map((entry, idx) => (
                                <div key={idx} className="mini-entry">
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
                </div>
            </div>
        </div>
    );
};

export default StartScreen;
