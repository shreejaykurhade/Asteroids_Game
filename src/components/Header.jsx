import { SpeakerLoudIcon, SpeakerOffIcon, RocketIcon } from '@radix-ui/react-icons';

const Header = ({ isMuted, onMuteToggle, onLeaderboardToggle, showLeaderboardBtn = true, isVerified, onLogout }) => {
    return (
        <div className="top-actions">
            <div
                id="mute-btn"
                className={isMuted ? "muted" : ""}
                onClick={onMuteToggle}
                title="Toggle Sound"
            >
                {isMuted ? <SpeakerOffIcon width={28} height={28} /> : <SpeakerLoudIcon width={28} height={28} />}
            </div>
            {showLeaderboardBtn && (
                <div
                    id="leaderboard-toggle"
                    onClick={onLeaderboardToggle}
                    title="Top 50 Rankings"
                >
                    <RocketIcon width={28} height={28} />
                </div>
            )}

            <div className="header-auth">
                {isVerified && (
                    <button className="logout-btn header-logout" onClick={onLogout}>
                        LOGOUT
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
