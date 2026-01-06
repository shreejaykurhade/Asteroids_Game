import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LeaderboardPage from './pages/LeaderboardPage';
import ShipSelectionPage from './pages/ShipSelectionPage';
import PilotGuidePage from './pages/PilotGuidePage';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';

import { loginWithGoogle, logoutUser, saveScoreToFirebase, trackSessionTime, auth, fetchLeaderboard } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import confetti from 'canvas-confetti';
import './styles/App.css';

const AppContent = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [playerName, setPlayerName] = useState(localStorage.getItem('ASTER_PLAYER_NAME') || "");
    const [isVerified, setIsVerified] = useState(localStorage.getItem('ASTER_VERIFIED') === 'true');
    const [isMuted, setIsMuted] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMsg, setNotificationMsg] = useState("");
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [selectedShip, setSelectedShip] = useState(localStorage.getItem('ASTER_SELECTED_SHIP') || "CLASSIC");

    const navigate = useNavigate();
    const location = useLocation();

    // Initialize leaderboard from Firebase
    useEffect(() => {
        const loadLeaderboard = async () => {
            const data = await fetchLeaderboard();
            setLeaderboard(data);
        };
        loadLeaderboard();
    }, [gameStarted]); // Refresh when game ends/starts

    useEffect(() => {
        // Firebase Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setPlayerName(user.displayName.toUpperCase());
                setIsVerified(true);
                localStorage.setItem('ASTER_PLAYER_NAME', user.displayName.toUpperCase());
                localStorage.setItem('ASTER_VERIFIED', 'true');
            } else {
                // Handle logout state if needed
            }
        });

        // Session Tracking
        const startTime = Date.now();
        const handleUnload = () => {
            if (auth.currentUser) {
                const duration = Date.now() - startTime;
                trackSessionTime(auth.currentUser.uid, duration);
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            unsubscribe();
            handleUnload(); // Save session on component unmount
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    const triggerLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStartGame = (name) => {
        setPlayerName(name.toUpperCase());
        setSessionStartTime(Date.now());
        setGameStarted(true);
    };

    const handleGameOver = async (finalScore) => {
        // Firebase Save
        if (auth.currentUser && isVerified) {
            await saveScoreToFirebase(auth.currentUser, finalScore, isVerified);

            // Refresh Leaderboard
            const newList = await fetchLeaderboard();
            setLeaderboard(newList);

            // Check if record broken (simple check against top #1)
            // Or personalized per original code... 
            // Since we moved to server-side only, "New PB" notifications are tricky without reading DB.
            // But we can check if we are in the new list!
        }

        setGameStarted(false);
        navigate('/');
    };

    const handleLogout = () => {
        logoutUser();
        localStorage.removeItem('ASTER_PLAYER_NAME');
        localStorage.setItem('ASTER_VERIFIED', 'false');
        localStorage.removeItem('ASTER_PLAYER_PB');
        window.location.reload();
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
                    isVerified={isVerified}
                    onLogout={handleLogout}
                />
            )}

            <Routes>
                <Route path="/" element={
                    !gameStarted ? (
                        <Home
                            onStart={handleStartGame}
                            leaderboard={leaderboard.slice(0, 5)}
                            isVerified={isVerified}
                            playerName={playerName}
                            onVerified={triggerLogin}
                            onLogout={handleLogout}
                        />
                    ) : null
                } />
                <Route path="/leaderboard" element={
                    <LeaderboardPage entries={leaderboard} isVerified={isVerified} />
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
