import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBigUp, ArrowBigLeft, ArrowBigRight, Keyboard, Zap, Shield, Target, MousePointer2 } from 'lucide-react';

const PilotGuidePage = () => {
    const navigate = useNavigate();

    const controls = [
        { icon: <ArrowBigUp />, label: "THRUST", key: "UP ARROW", desc: "Engage main engines for propulsion." },
        { icon: <Keyboard>Z</Keyboard>, label: "ABILITY", key: "Z KEY", desc: "Activate ship-specific special tactical ability." },
        { icon: <ArrowBigLeft />, label: "STEER", key: "L/R ARROWS", desc: "Rotate vessel clockwise or counter-clockwise." },
        { icon: <Keyboard>SPACE</Keyboard>, label: "FIRE", key: "SPACEBAR", desc: "Deploy standard laser battery." },
    ];

    return (
        <div className="main-container guide-page">
            <div className="retro-container">
                <button className="back-btn-corner" onClick={() => navigate('/')}>
                    BACK
                </button>

                <h1>PILOT MANUAL</h1>

                <div className="guide-grid">
                    <div className="guide-section controls-section">
                        <h3><MousePointer2 size={20} /> FLIGHT CONTROLS</h3>
                        <div className="controls-list">
                            {controls.map((ctrl, idx) => (
                                <div key={idx} className="control-card">
                                    <div className="control-visual">
                                        {ctrl.icon}
                                        <span className="control-key">{ctrl.key}</span>
                                    </div>
                                    <div className="control-info">
                                        <div className="control-label">{ctrl.label}</div>
                                        <div className="control-desc">{ctrl.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="guide-section tactical-section">
                        <h3><Zap size={20} /> TACTICAL INTEL</h3>
                        <div className="intel-list">
                            <div className="intel-item">
                                <div className="intel-icon"><Shield size={18} /></div>
                                <div className="intel-text">
                                    <strong>LEVEL 10+:</strong> Enemy Hexagons appear with heavy hull plating.
                                </div>
                            </div>
                            <div className="intel-item">
                                <div className="intel-icon"><Target size={18} /></div>
                                <div className="intel-text">
                                    <strong>LEVEL 15+:</strong> Automated Sentry Squares engage with precise aim.
                                </div>
                            </div>
                            <div className="intel-item">
                                <div className="intel-icon"><Keyboard>Z</Keyboard></div>
                                <div className="intel-text">
                                    <strong>SPECIALS:</strong> Abilities require energy recharge (see HUD bar).
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="confirm-ship-btn" style={{ marginTop: '30px' }} onClick={() => navigate('/')}>
                    ACKNOWLEDGED
                </button>
            </div>
        </div>
    );
};

export default PilotGuidePage;
