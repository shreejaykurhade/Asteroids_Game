import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LeaderboardPage from './pages/LeaderboardPage';
import ShipSelectionPage from './pages/ShipSelectionPage';
import PilotGuidePage from './pages/PilotGuidePage';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';

import { getLeaderboard, saveToLeaderboard } from './utils/leaderboard';
import confetti from 'canvas-confetti';
import './styles/App.css';

const AppContent = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [playerName, setPlayerName] = useState(localStorage.getItem('ASTER_PLAYER_NAME') || "");
    const [isMuted, setIsMuted] = useState(false);
    const [leaderboard, setLeaderboard] = useState(getLeaderboard());
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMsg, setNotificationMsg] = useState("");
    const [selectedShip, setSelectedShip] = useState(localStorage.getItem('ASTER_SELECTED_SHIP') || "CLASSIC");

    const navigate = useNavigate();
    const location = useLocation();

    // Initialize local leaderboard
    useEffect(() => {
        setLeaderboard(getLeaderboard());
    }, []);

    const handleStartGame = (name) => {
        setPlayerName(name.toUpperCase());
        localStorage.setItem('ASTER_PLAYER_NAME', name.toUpperCase());
        setGameStarted(true);
    };

    const handleGameOver = (finalScore) => {
        // Local Save & Notification logic
        const { leaderboard: newList, isNewPB } = saveToLeaderboard(playerName, finalScore, false); // isVerified false
        setLeaderboard(newList);

        if (isNewPB) {
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
                    isVerified={false}
                    onLogout={() => { }}
                />
            )}

            <Routes>
                <Route path="/" element={
                    !gameStarted ? (
                        <Home
                            onStart={handleStartGame}
                            leaderboard={leaderboard.slice(0, 5)}
                            isVerified={false}
                            playerName={playerName}
                            onVerified={() => { }}
                            onLogout={() => { }}
                        />
                    ) : null
                } />
                <Route path="/leaderboard" element={
                    <LeaderboardPage entries={leaderboard} isVerified={true} />
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
                isVerified={isVerified}
                isMuted={isMuted}
                onGameOver={handleGameOver}
                shipType={selectedShip}
            />

            {gameStarted && <MobileControls />}

            {!gameStarted && !isHangarPage && !isGuidePage && <footer>MADE WITH ❤️ BY SHREEJAY</footer>}

            {showNotification && (
                <div className="record-notification">
                    <div className="record-glow"></div>
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
