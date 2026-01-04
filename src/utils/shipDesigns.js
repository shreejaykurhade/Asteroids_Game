export const SHIP_DESIGNS = {
    CLASSIC: {
        name: "CLASSIC",
        description: "Standard balanced model.",
        stats: { accel: 1.5, turn: 1.5, fireRate: 2.0, speed: 1.5, laserSize: 2.0 },
        ability: { name: "None", cd: 0 },
        draw: (ctx, x, y, a, r) => {
            ctx.moveTo(x + 4 / 3 * r * Math.cos(a), y - 4 / 3 * r * Math.sin(a));
            ctx.lineTo(x - r * (2 / 3 * Math.cos(a) + Math.sin(a)), y + r * (2 / 3 * Math.sin(a) - Math.cos(a)));
            ctx.lineTo(x - r * (2 / 3 * Math.cos(a) - Math.sin(a)), y + r * (2 / 3 * Math.sin(a) + Math.cos(a)));
        }
    },
    INTERCEPTOR: {
        name: "INTERCEPTOR",
        description: "High-speed burst specialist.",
        stats: { accel: 1.8, turn: 1.6, fireRate: 1.6, speed: 1.8, laserSize: 1.6 },
        ability: { name: "Burst Fire", cd: 5000 },
        draw: (ctx, x, y, a, r) => {
            ctx.moveTo(x + 1.5 * r * Math.cos(a + 0.2), y - 1.5 * r * Math.sin(a + 0.2));
            ctx.lineTo(x + 0.5 * r * Math.cos(a), y - 0.5 * r * Math.sin(a));
            ctx.lineTo(x + 1.5 * r * Math.cos(a - 0.2), y - 1.5 * r * Math.sin(a - 0.2));
            ctx.lineTo(x - r * (0.8 * Math.cos(a) - 0.8 * Math.sin(a)), y + r * (0.8 * Math.sin(a) + 0.8 * Math.cos(a)));
            ctx.lineTo(x - 0.5 * r * Math.cos(a), y + 0.5 * r * Math.sin(a));
            ctx.lineTo(x - r * (0.8 * Math.cos(a) + 0.8 * Math.sin(a)), y + r * (0.8 * Math.sin(a) - 0.8 * Math.cos(a)));
        }
    },
    VINDICATOR: {
        name: "VINDICATOR",
        description: "Heavy hitting force of nature.",
        stats: { accel: 1.2, turn: 1.0, fireRate: 3.0, speed: 1.3, laserSize: 3.0 },
        ability: { name: "Gravity Wave", cd: 8000 },
        draw: (ctx, x, y, a, r) => {
            // Main Body (Closed Shape)
            ctx.moveTo(x + r * Math.cos(a), y - r * Math.sin(a));
            ctx.lineTo(x + r * Math.cos(a + 1.2), y - r * Math.sin(a + 1.2));
            ctx.lineTo(x - 0.5 * r * Math.cos(a), y + 0.5 * r * Math.sin(a));
            ctx.lineTo(x + r * Math.cos(a - 1.2), y - r * Math.sin(a - 1.2));
            ctx.lineTo(x + r * Math.cos(a), y - r * Math.sin(a)); // Close loop to nose

            // Internal Wing Detail (connected)
            ctx.moveTo(x - 0.2 * r * Math.cos(a), y + 0.2 * r * Math.sin(a));
            ctx.lineTo(x + r * 0.8 * Math.cos(a + 1), y - r * 0.8 * Math.sin(a + 1));

            ctx.moveTo(x - 0.2 * r * Math.cos(a), y + 0.2 * r * Math.sin(a));
            ctx.lineTo(x + r * 0.8 * Math.cos(a - 1), y - r * 0.8 * Math.sin(a - 1));
        }
    },
    PHALANX: {
        name: "PHALANX",
        description: "The armored space fortress.",
        stats: { accel: 1.1, turn: 0.9, fireRate: 2.4, speed: 1.2, laserSize: 4.0 },
        ability: { name: "Pulse Shield", cd: 10000 },
        draw: (ctx, x, y, a, r) => {
            ctx.moveTo(x + 1.2 * r * Math.cos(a), y - 1.2 * r * Math.sin(a));
            ctx.lineTo(x + r * (Math.cos(a + 1.2)), y - r * (Math.sin(a + 1.2)));
            ctx.lineTo(x - 0.8 * r * Math.cos(a + 0.5), y + 0.8 * r * Math.sin(a + 0.5));
            ctx.lineTo(x - 0.8 * r * Math.cos(a - 0.5), y + 0.8 * r * Math.sin(a - 0.5));
            ctx.lineTo(x + r * (Math.cos(a - 1.2)), y - r * (Math.sin(a - 1.2)));
        }
    },
    SCOUT: {
        name: "SCOUT",
        description: "Agile, lightweight scout ship.",
        stats: { accel: 2.2, turn: 2.2, fireRate: 1.4, speed: 2.1, laserSize: 1.2 },
        ability: { name: "Warp Dash", cd: 4000 },
        draw: (ctx, x, y, a, r) => {
            ctx.moveTo(x + 1.6 * r * Math.cos(a), y - 1.6 * r * Math.sin(a));
            ctx.lineTo(x + r * Math.cos(a + 1.8), y - r * Math.sin(a + 1.8));
            ctx.lineTo(x - 0.4 * r * Math.cos(a), y + 0.4 * r * Math.sin(a));
            ctx.lineTo(x + r * Math.cos(a - 1.8), y - r * Math.sin(a - 1.8));
        }
    },
    WRAITH: {
        name: "WRAITH",
        description: "Experimental stealth craft.",
        stats: { accel: 1.6, turn: 1.8, fireRate: 2.2, speed: 1.6, laserSize: 2.0 },
        ability: { name: "Stealth", cd: 12000 },
        draw: (ctx, x, y, a, r) => {
            ctx.moveTo(x + 1.4 * r * Math.cos(a), y - 1.4 * r * Math.sin(a));
            ctx.lineTo(x - r * (Math.cos(a) + 1.2 * Math.sin(a)), y + r * (Math.sin(a) - 1.2 * Math.cos(a)));
            ctx.lineTo(x - 0.5 * r * Math.cos(a), y + 0.5 * r * Math.sin(a));
            ctx.lineTo(x - r * (Math.cos(a) - 1.2 * Math.sin(a)), y + r * (Math.sin(a) + 1.2 * Math.cos(a)));
        }
    }
};
