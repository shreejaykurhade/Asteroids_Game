import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SpeakerLoudIcon, SpeakerOffIcon } from '@radix-ui/react-icons';
import { Trophy, Rocket } from 'lucide-react';

const Header = ({
    isMuted,
    onMuteToggle,
    onLeaderboardToggle,
    onHangarToggle,
    showLeaderboardBtn = true,
    showHangarBtn = true,
    isVerified,
    onLogout
}) => {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <div className="nav-left" onClick={() => navigate('/')}>
                <span className="logo-text">Asteroid<span className="logo-accent">React</span></span>
            </div>

            <div className="nav-right">
                {showLeaderboardBtn && (
                    <div
                        className="nav-icon-btn"
                        onClick={onLeaderboardToggle}
                        title="Leaderboard"
                    >
                        <Trophy size={20} />
                    </div>
                )}
                {showHangarBtn && (
                    <div
                        className="nav-icon-btn"
                        onClick={onHangarToggle}
                        title="Ship Hangar"
                    >
                        <Rocket size={20} />
                    </div>
                )}
                <div
                    className="nav-icon-btn nav-mute-btn"
                    onClick={onMuteToggle}
                    title="Toggle Sound"
                >
                    {isMuted ? <SpeakerOffIcon width={20} height={20} /> : <SpeakerLoudIcon width={20} height={20} />}
                </div>

                {isVerified && (
                    <button className="nav-logout-btn" onClick={onLogout}>
                        LOGOUT
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Header;
