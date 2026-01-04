export const ENEMY_DESIGNS = {
    SQUARE: {
        name: "SQUARE",
        score: 250,
        health: 1,
        radiusMult: 0.9,
        shootChance: 0.03, // Increased from 0.01 (3x)
        speedMult: 1.0,
        draw: (ctx, x, y, r, a, color = "white") => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - r, y - r, r * 2, r * 2);
            ctx.shadowBlur = 0;

            // Core
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    ELITE: { // Previously ELITE SQUARE
        name: "ELITE",
        score: 500,
        health: 3,
        radiusMult: 1.0,
        shootChance: 0.08, // Increased from 0.03 (almost 3x)
        speedMult: 1.3,
        draw: (ctx, x, y, r, a, color = "#a855f7") => {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a);
            ctx.strokeRect(-r, -r, r * 2, r * 2);

            // Inner rotating square
            ctx.rotate(-a * 2);
            ctx.fillStyle = "rgba(168, 85, 247, 0.5)";
            ctx.fillRect(-r * 0.5, -r * 0.5, r, r);
            ctx.restore();

            ctx.shadowBlur = 0;
        }
    },
    HEXAGON: {
        name: "HEXAGON",
        score: 1000,
        health: 5,
        radiusMult: 1.5,
        shootChance: 0.01, // Now occasional fire (was 0)
        speedMult: 0.6,
        draw: (ctx, x, y, r, a, color = "lime") => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const ang = a + i * Math.PI / 3;
                ctx.lineTo(x + r * Math.cos(ang), y - r * Math.sin(ang));
            }
            ctx.closePath();
            ctx.stroke();

            // Heavy plating look
            ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    },
    // New Enemy 3: PENTAGON (Tanky, slow, heavy hitter)
    PENTAGON: {
        name: "PENTAGON",
        score: 600,
        health: 4,
        radiusMult: 1.2,
        shootChance: 0.02,
        speedMult: 0.5,
        draw: (ctx, x, y, r, a, color = "#ff00ff") => { // Magenta
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;

            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const ang = a + i * Math.PI * 2 / 5;
                ctx.lineTo(x + r * Math.cos(ang), y - r * Math.sin(ang));
            }
            ctx.closePath();
            ctx.stroke();

            // Inner styling
            ctx.fillStyle = "rgba(255, 0, 255, 0.1)";
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    },
    // New Enemy 4: DIAMOND (Fast, agile, distraction)
    DIAMOND: {
        name: "DIAMOND",
        score: 400,
        health: 2,
        radiusMult: 0.8,
        shootChance: 0.06,
        speedMult: 1.6,
        draw: (ctx, x, y, r, a, color = "#00ffff") => { // Cyan/Aqua
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x, y - r); // Top
            ctx.lineTo(x + r * 0.7, y); // Right
            ctx.lineTo(x, y + r); // Bottom
            ctx.lineTo(x - r * 0.7, y); // Left
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y - r * 0.5);
            ctx.lineTo(x, y + r * 0.5);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }
    },
    // New Enemy 1: TRIANGLE (Fast, fragile, kamikaze-ish)
    TRIANGLE: {
        name: "TRIANGLE",
        score: 300,
        health: 1,
        radiusMult: 0.7,
        shootChance: 0.05, // Aggressive
        speedMult: 1.8,
        draw: (ctx, x, y, r, a, color = "orange") => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            const angleOffset = Math.PI * 2 / 3;
            ctx.moveTo(x + r * Math.cos(a), y - r * Math.sin(a));
            ctx.lineTo(x + r * Math.cos(a + angleOffset), y - r * Math.sin(a + angleOffset));
            ctx.lineTo(x + r * Math.cos(a + 2 * angleOffset), y - r * Math.sin(a + 2 * angleOffset));
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },
    // New Enemy 2: OCTAGON (Mini-Boss / Turret)
    OCTAGON: {
        name: "OCTAGON",
        score: 1500,
        health: 8,
        radiusMult: 2.0,
        shootChance: 0.1, // Very aggressive turret
        speedMult: 0.4,
        draw: (ctx, x, y, r, a, color = "cyan") => {
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;

            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const ang = a + i * Math.PI / 4;
                ctx.lineTo(x + r * Math.cos(ang), y - r * Math.sin(ang));
            }
            ctx.closePath();
            ctx.stroke();

            // Crosshairs
            ctx.beginPath();
            ctx.moveTo(x - r / 2, y);
            ctx.lineTo(x + r / 2, y);
            ctx.moveTo(x, y - r / 2);
            ctx.lineTo(x, y + r / 2);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }
    }
};
