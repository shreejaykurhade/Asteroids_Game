import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Rocket, Zap, Shield, Target, Gauge, ChevronLeft as BackIcon } from 'lucide-react';
import { SHIP_DESIGNS } from '../utils/shipDesigns';

const ShipPreview = ({ design, isSelected }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Rotating animation or just static? Let's make it look nice
        ctx.strokeStyle = isSelected ? "#4facfe" : "white";
        ctx.lineWidth = 2;
        ctx.shadowBlur = isSelected ? 15 : 0;
        ctx.shadowColor = "#4facfe";

        ctx.beginPath();
        // Draw slightly larger in the hangar
        design.draw(ctx, canvas.width / 2, canvas.height / 2, Math.PI / 2, 35);
        ctx.closePath();
        ctx.stroke();
    }, [design, isSelected]);

    return <canvas ref={canvasRef} width={150} height={150} className="hangar-preview-canvas" />;
};

const ShipSelectionPage = ({ selectedShip, onShipSelect }) => {
    const navigate = useNavigate();
    const shipKeys = Object.keys(SHIP_DESIGNS);
    const [shipIdx, setShipIdx] = useState(shipKeys.indexOf(selectedShip));

    const currentShip = SHIP_DESIGNS[shipKeys[shipIdx]];

    const nextShip = () => setShipIdx((shipIdx + 1) % shipKeys.length);
    const prevShip = () => setShipIdx((shipIdx - 1 + shipKeys.length) % shipKeys.length);

    const handleConfirm = () => {
        onShipSelect(shipKeys[shipIdx]);
        navigate('/');
    };

    return (
        <div className="main-container hangar-page">
            <div className="retro-container">
                <button className="back-btn-corner" onClick={() => navigate('/')}>
                    <BackIcon size={20} /> BACK
                </button>

                <h1>SHIP HANGAR</h1>

                <div className="hangar-commander-view">
                    <button className="nav-arrow lg" onClick={prevShip}><ChevronLeft size={48} /></button>

                    <div className="ship-spotlight">
                        <div className="preview-container">
                            <ShipPreview design={currentShip} isSelected={true} />
                        </div>
                        <div className="ship-details-card">
                            <h2 className="hangar-ship-name">{currentShip.name}</h2>
                            <p className="hangar-ship-desc">{currentShip.description}</p>

                            <div className="hangar-stats-grid">
                                <div className="hangar-stat-item">
                                    <div className="stat-label"><Zap size={14} /> THRUST</div>
                                    <div className="hangar-stat-bar">
                                        <div className="hangar-stat-fill" style={{ width: `${currentShip.stats.accel * 60}%` }}></div>
                                    </div>
                                </div>
                                <div className="hangar-stat-item">
                                    <div className="stat-label"><Gauge size={14} /> AGILITY</div>
                                    <div className="hangar-stat-bar">
                                        <div className="hangar-stat-fill" style={{ width: `${currentShip.stats.turn * 60}%` }}></div>
                                    </div>
                                </div>
                                <div className="hangar-stat-item">
                                    <div className="stat-label"><Target size={14} /> FIRE RATE</div>
                                    <div className="hangar-stat-bar">
                                        <div className="hangar-stat-fill" style={{ width: `${(2 - currentShip.stats.fireRate) * 50}%` }}></div>
                                    </div>
                                </div>
                                <div className="hangar-special-ability">
                                    <div className="ability-title"><Shield size={16} /> SPECIAL ABILITY</div>
                                    <div className="ability-name">{currentShip.ability.name}</div>
                                </div>
                            </div>

                            <button className="confirm-ship-btn" onClick={handleConfirm}>
                                COMMISSION VESSEL
                            </button>
                        </div>
                    </div>

                    <button className="nav-arrow lg" onClick={nextShip}><ChevronRight size={48} /></button>
                </div>
            </div>
        </div>
    );
};

export default ShipSelectionPage;
