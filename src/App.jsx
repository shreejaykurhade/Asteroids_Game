import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LeaderboardPage from './pages/LeaderboardPage';
import ShipSelectionPage from './pages/ShipSelectionPage';
import PilotGuidePage from './pages/PilotGuidePage';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';

import confetti from 'canvas-confetti';
import './styles/App.css';

const AppContent = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [playerName, setPlayerName] = useState(localStorage.getItem('ASTER_PLAYER_NAME') || "");
    const [isMuted, setIsMuted] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMsg, setNotificationMsg] = useState("");
    const [selectedShip, setSelectedShip] = useState(localStorage.getItem('ASTER_SELECTED_SHIP') || "CLASSIC");

    const navigate = useNavigate();
    const location = useLocation();

    // Fetch leaderboard from API (or fallback to localStorage for local dev)
    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('/api/leaderboard');
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data);
                return;
            }
        } catch (error) {
            console.log('API not available (local dev), using localStorage fallback');
        }

        // Fallback to localStorage for local development
        const localData = localStorage.getItem('ASTER_LEADERBOARD');
        if (localData) {
            setLeaderboard(JSON.parse(localData));
        }
    };

    // Initialize leaderboard on mount
    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const handleStartGame = (name) => {
        setPlayerName(name.toUpperCase());
        localStorage.setItem('ASTER_PLAYER_NAME', name.toUpperCase());
        setGameStarted(true);
    };

    const handleGameOver = async (finalScore) => {
        let updatedLeaderboard = [...leaderboard];
        let isTopScore = false;

        try {
            // Try to save score to API
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: playerName,
                    score: finalScore
                })
            });

            if (response.ok) {
                const result = await response.json();
                updatedLeaderboard = result.leaderboard;
                setLeaderboard(updatedLeaderboard);

                // Check if this is a new personal best (top 20)
                const playerEntry = result.leaderboard.find(e => e.name === playerName);
                isTopScore = playerEntry && playerEntry.score === finalScore;
            }
        } catch (error) {
            console.log('API not available, using localStorage');

            // Fallback to localStorage for local development
            const existingIndex = updatedLeaderboard.findIndex(e => e.name === playerName);

            if (existingIndex !== -1) {
                if (finalScore > updatedLeaderboard[existingIndex].score) {
                    updatedLeaderboard[existingIndex].score = finalScore;
                    updatedLeaderboard[existingIndex].timestamp = Date.now();
                    isTopScore = true;
                }
            } else {
                updatedLeaderboard.push({
                    name: playerName,
                    score: finalScore,
                    timestamp: Date.now()
                });
                isTopScore = true;
            }

            updatedLeaderboard.sort((a, b) => b.score - a.score);
            updatedLeaderboard = updatedLeaderboard.slice(0, 20);

            localStorage.setItem('ASTER_LEADERBOARD', JSON.stringify(updatedLeaderboard));
            setLeaderboard(updatedLeaderboard);
        }

        if (isTopScore) {
            setNotificationMsg(`NEW RECORD! PILOT ${playerName} REACHED ${finalScore}!`);
            setShowNotification(true);

            // Celebration!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#ffffff', '#ff4500']
            });

            setTimeout(() => setShowNotification(false), 5000);
        }

        setGameStarted(false);
        navigate('/');
    };

    const isLeaderboardPage = location.pathname === '/leaderboard';
    const isHangarPage = location.pathname === '/hangar';
    const isGuidePage = location.pathname === '/guide';

    return (
        <div className="app">
            {!gameStarted && !isHangarPage && !isGuidePage && (
                <Header
                    isMuted={isMuted}
                    onMuteToggle={() => setIsMuted(!isMuted)}
                    onLeaderboardToggle={() => navigate('/leaderboard')}
                    onHangarToggle={() => navigate('/hangar')}
                    onGuideToggle={() => navigate('/guide')}
                    showLeaderboardBtn={!isLeaderboardPage}
                    showHangarBtn={!isHangarPage}
                    showGuideBtn={!isGuidePage}
                    onLogout={() => { }}
                />
            )}

            <Routes>
                <Route path="/" element={
                    !gameStarted ? (
                        <Home
                            onStart={handleStartGame}
                            leaderboard={leaderboard.slice(0, 5)}
                            playerName={playerName}
                        />
                    ) : null
                } />
                <Route path="/leaderboard" element={
                    <LeaderboardPage entries={leaderboard} />
                } />
                <Route path="/hangar" element={
                    <ShipSelectionPage
                        selectedShip={selectedShip}
                        onShipSelect={(ship) => {
                            setSelectedShip(ship);
                            localStorage.setItem('ASTER_SELECTED_SHIP', ship);
                        }}
                    />
                } />
                <Route path="/guide" element={<PilotGuidePage />} />
            </Routes>

            <GameCanvas
                gameStarted={gameStarted}
                playerName={playerName}
                isMuted={isMuted}
                onGameOver={handleGameOver}
                shipType={selectedShip}
            />

            {gameStarted && <MobileControls />}

            {!gameStarted && !isHangarPage && !isGuidePage && <footer>MADE WITH ❤️ BY SHREEJAY</footer>}

            {showNotification && (
                <div className="record-notification">
                    <div className="record-content">
                        <h2>🏆 RECORD BROKEN 🏆</h2>
                        <p>{notificationMsg}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;
