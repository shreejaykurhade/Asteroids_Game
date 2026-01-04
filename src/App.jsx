import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LeaderboardPage from './pages/LeaderboardPage';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';
import { getLeaderboard } from './utils/leaderboard';
import './styles/App.css';

function AppContent() {
    const [gameStarted, setGameStarted] = useState(false);
    const [playerName, setPlayerName] = useState(localStorage.getItem('ASTER_PLAYER_NAME') || '');
    const [isVerified, setIsVerified] = useState(localStorage.getItem('ASTER_VERIFIED') === 'true');
    const [isMuted, setIsMuted] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setLeaderboard(getLeaderboard());
    }, []);

    useEffect(() => {
        // Initialize Google Sign-In
        const initGoogle = () => {
            if (!window.google) {
                setTimeout(initGoogle, 100);
                return;
            }

            if (window._gsi_initialized) return;
            window._gsi_initialized = true;

            const { CONFIG } = import.meta.glob('./utils/config.js', { eager: true })['./utils/config.js'];
            const clientId = CONFIG.GOOGLE_CLIENT_ID;

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    const payload = JSON.parse(atob(response.credential.split('.')[1]));
                    const name = payload.name.toUpperCase();
                    setPlayerName(name);
                    setIsVerified(true);
                    localStorage.setItem('ASTER_PLAYER_NAME', name);
                    localStorage.setItem('ASTER_VERIFIED', 'true');
                }
            });

            const target = document.getElementById("g_id_signin");
            if (target) {
                window.google.accounts.id.renderButton(target, {
                    theme: "outline",
                    size: "large",
                    shape: "rectangular",
                    text: "signin_with",
                    logo_alignment: "left"
                });
            }
        };

        if (!gameStarted) {
            initGoogle();
        }
    }, [gameStarted]);

    const handleStartGame = (name) => {
        setPlayerName(name);
        setGameStarted(true);
    };

    const handleGameOver = (finalScore) => {
        setGameStarted(false);
        setLeaderboard(getLeaderboard());
    };

    const handleLogout = () => {
        localStorage.removeItem('ASTER_PLAYER_NAME');
        localStorage.setItem('ASTER_VERIFIED', 'false');
        window.location.reload();
    };

    // Hide UI if playing
    const isLeaderboardPage = location.pathname === '/leaderboard';

    return (
        <div className="app">
            {/* UI persistent only on Home Screen as requested */}
            {!gameStarted && (
                <Header
                    isMuted={isMuted}
                    onMuteToggle={() => setIsMuted(!isMuted)}
                    onLeaderboardToggle={() => navigate('/leaderboard')}
                    showLeaderboardBtn={!isLeaderboardPage}
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
                            onVerified={(name) => {
                                setPlayerName(name);
                                setIsVerified(true);
                                localStorage.setItem('ASTER_PLAYER_NAME', name);
                                localStorage.setItem('ASTER_VERIFIED', 'true');
                            }}
                            onLogout={handleLogout}
                        />
                    ) : null
                } />
                <Route path="/leaderboard" element={
                    <LeaderboardPage entries={leaderboard} isVerified={isVerified} />
                } />
            </Routes>

            <GameCanvas
                gameStarted={gameStarted}
                playerName={playerName}
                isVerified={isVerified}
                isMuted={isMuted}
                onGameOver={handleGameOver}
            />

            {gameStarted && <MobileControls />}

            {!gameStarted && <footer>MADE WITH ❤️ BY SHREEJAY</footer>}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
