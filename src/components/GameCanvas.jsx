import React, { useRef, useEffect } from 'react';
import * as Constants from '../utils/constants';
import { Music, Sound } from '../utils/audio';
import { saveToLeaderboard } from '../utils/leaderboard';
import { SHIP_DESIGNS } from '../utils/shipDesigns';

const GameCanvas = ({ gameStarted, playerName, isVerified, isMuted, onGameOver, shipType }) => {
    const canvasRef = useRef(null);
    const gameRef = useRef({
        level: 0,
        lives: Constants.GAME_LIVES,
        score: 0,
        ship: null,
        roids: [],
        text: '',
        textAlpha: 0,
        roidsLeft: 0,
        roidsTotal: 0,
        enemies: [],
        enemyLasers: [],
        gameLoop: null,
        sounds: {
            explode: new Sound("/sounds/explode.m4a"),
            hit: new Sound("/sounds/hit.m4a", 5),
            laser: new Sound("/sounds/laser.m4a", 5, 0.5),
            thrust: new Sound("/sounds/thrust.m4a"),
            music: new Music("/sounds/music-low.m4a", "/sounds/music-high.m4a")
        },
        explosions: [] // New explosion particles array
    });

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (gameStarted) {
            startNewGame();
            gameRef.current.gameLoop = setInterval(update, 1000 / Constants.FPS);
        } else {
            clearInterval(gameRef.current.gameLoop);
        }

        return () => clearInterval(gameRef.current.gameLoop);
    }, [gameStarted]);

    // Handle Input
    useEffect(() => {
        const handleKeyDown = (ev) => {
            if (!gameStarted || !gameRef.current.ship || gameRef.current.ship.dead) return;
            switch (ev.keyCode) {
                case 32: // Space
                    shootLaser();
                    break;
                case 90: // Z key for Ability
                    activateAbility();
                    break;
                case 37: // Left
                    gameRef.current.ship.rot = gameRef.current.ship.turn;
                    break;
                case 38: // Up
                    gameRef.current.ship.thrusting = true;
                    break;
                case 39: // Right
                    gameRef.current.ship.rot = -gameRef.current.ship.turn;
                    break;
                default: break;
            }
        };

        const handleKeyUp = (ev) => {
            if (!gameStarted || !gameRef.current.ship || gameRef.current.ship.dead) return;
            switch (ev.keyCode) {
                case 32: // Space
                    gameRef.current.ship.canShoot = true;
                    break;
                case 37: // Left
                case 39: // Right
                    gameRef.current.ship.rot = 0;
                    break;
                case 38: // Up
                    gameRef.current.ship.thrusting = false;
                    break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameStarted]);

    const startNewGame = () => {
        const game = gameRef.current;
        game.level = 0;
        game.lives = Constants.GAME_LIVES;
        game.score = 0;
        game.ship = newShip();
        startNewLevel();
    };

    const startNewLevel = () => {
        const game = gameRef.current;
        game.sounds.music.setAsteroidRatio(1);
        game.text = "Level " + (game.level + 1);
        game.textAlpha = 1.0;
        createAsteroidBelt();
        // Start spawning enemies from Level 10 onwards as requested
        if (game.level >= 9) {
            spawnEnemies();
        }
    };

    const newShip = () => {
        const scale = getScale();
        const design = SHIP_DESIGNS[shipType] || SHIP_DESIGNS.CLASSIC;
        const stats = design.stats;

        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            a: 90 / 180 * Math.PI,
            r: (Constants.SHIP_SIZE * scale) / 2,
            blinkNum: Math.ceil(Constants.SHIP_INV_DUR / Constants.SHIP_BLINK_DUR),
            blinkTime: Math.ceil(Constants.SHIP_BLINK_DUR * Constants.FPS),
            canShoot: true,
            dead: false,
            explodeTime: 0,
            lasers: [],
            rot: 0,
            thrusting: false,
            thrust: { x: 0, y: 0 },
            type: shipType, // Store type to avoid stale closures
            // Specialized Stats
            accel: Constants.SHIP_THRUST * stats.accel * 0.5, // Reduced acceleration as requested
            turn: (Constants.SHIP_TURN_SPD * stats.turn) / 180 * Math.PI / Constants.FPS,
            fireRate: stats.fireRate,
            fireCooldown: 0,
            laserSize: stats.laserSize || 1.0,
            // Ability State
            ability: design.ability,
            status: { x: 0, y: 0 },
            abilityCooldown: 0,
            abilityActive: false,
            abilityTimer: 0
        };
    };

    const getScale = () => {
        return window.innerWidth < 768 ? 0.7 : 1.0;
    };

    const createAsteroidBelt = () => {
        const game = gameRef.current;
        game.roids = [];
        const scale = getScale();

        // Calculate asteroid count based on level
        let numAsteroids;
        if (game.level < 5) numAsteroids = Math.floor(Math.random() * 3) + 2; // 2-4
        else if (game.level < 10) numAsteroids = Math.floor(Math.random() * 3) + 3; // 3-5
        else if (game.level < 15) numAsteroids = Math.floor(Math.random() * 5) + 3; // 3-7
        else if (game.level < 20) numAsteroids = Math.floor(Math.random() * 3) + 5; // 5-7
        else numAsteroids = Math.floor(Math.random() * 4) + 7; // 7-10

        game.roidsTotal = numAsteroids * 7;
        game.roidsLeft = game.roidsTotal;
        let x, y;
        for (let i = 0; i < numAsteroids; i++) {
            do {
                x = Math.floor(Math.random() * window.innerWidth);
                y = Math.floor(Math.random() * window.innerHeight);
            } while (Constants.distBetweenPoints(game.ship.x, game.ship.y, x, y) < Constants.ROID_SIZE * scale * 2 + game.ship.r);
            // Size 3 = Large
            game.roids.push(newAsteroid(x, y, Math.ceil(Constants.ROID_SIZE * scale / 2), 3));
        }
    };

    const spawnEnemies = () => {
        const game = gameRef.current;
        game.enemies = [];

        // Gating rules: 
        // Hexagons: Level 10+ (game.level 9+)
        // Squares: Level 15+ (game.level 14+)
        // Elite Squares: Level 17+ (game.level 16+)

        const types = [];
        if (game.level >= 9) types.push('HEXAGON');
        if (game.level >= 14) types.push('SQUARE');
        if (game.level >= 16) types.push('ELITE');

        if (types.length === 0) return;

        const numEnemies = Math.min(1 + Math.floor((game.level - 8) / 3), 5);
        for (let i = 0; i < numEnemies; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * window.innerWidth);
                y = Math.floor(Math.random() * window.innerHeight);
            } while (Constants.distBetweenPoints(game.ship.x, game.ship.y, x, y) < Constants.ROID_SIZE * 3);

            const type = types[Math.floor(Math.random() * types.length)];
            game.enemies.push(newEnemy(x, y, type));
        }
    };

    const newEnemy = (x, y, type) => {
        const game = gameRef.current;
        const lvlMult = 1 + 0.1 * game.level;
        const scale = getScale();
        const baseSize = Constants.SHIP_SIZE * scale;

        return {
            x, y,
            type: type === 'ELITE' ? 'SQUARE' : type,
            isElite: type === 'ELITE',
            r: type === 'HEXAGON' ? baseSize * 1.5 : baseSize * 0.9,
            xv: (Math.random() * 2 - 1) * Constants.ROID_SPD * 0.5 * lvlMult / Constants.FPS,
            yv: (Math.random() * 2 - 1) * Constants.ROID_SPD * 0.5 * lvlMult / Constants.FPS,
            health: type === 'HEXAGON' ? 5 : (type === 'ELITE' ? 3 : 1),
            maxHealth: type === 'HEXAGON' ? 5 : (type === 'ELITE' ? 3 : 1),
            shootTime: type !== 'HEXAGON' ? Math.floor(Math.random() * 150) + 100 : 0,
            a: Math.random() * Math.PI * 2
        };
    };

    const newAsteroid = (x, y, r, size) => {
        const game = gameRef.current;
        const lvlMult = 1 + 0.1 * game.level;
        const roid = {
            x: x, y: y,
            xv: Math.random() * Constants.ROID_SPD * lvlMult / Constants.FPS * (Math.random() < 0.5 ? 1 : -1),
            yv: Math.random() * Constants.ROID_SPD * lvlMult / Constants.FPS * (Math.random() < 0.5 ? 1 : -1),
            a: Math.random() * Math.PI * 2,
            r: r,
            size: size, // 3: Large, 2: Medium, 1: Small
            offs: [],
            vert: Math.floor(Math.random() * (Constants.ROID_VERT + 1) + Constants.ROID_VERT / 2)
        };
        for (let i = 0; i < roid.vert; i++) {
            roid.offs.push(Math.random() * Constants.ROID_JAG * 2 + 1 - Constants.ROID_JAG);
        }
        return roid;
    };

    const shootLaser = () => {
        const game = gameRef.current;
        const ship = game.ship;
        if (ship.dead) return;

        // Check fire rate cooldown
        if (ship.fireCooldown > 0) return;

        if (ship.canShoot && ship.lasers.length < Constants.LASER_MAX) {
            const createLaser = (angleOffset = 0) => {
                ship.lasers.push({
                    x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a + angleOffset),
                    y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a + angleOffset),
                    xv: Constants.LASER_SPD * Math.cos(ship.a + angleOffset) / Constants.FPS,
                    yv: -Constants.LASER_SPD * Math.sin(ship.a + angleOffset) / Constants.FPS,
                    dist: 0,
                    explodeTime: 0,
                    r: Constants.LASER_SIZE * ship.laserSize // Use ship.laserSize for projectile geometry
                });
            };

            createLaser();

            game.sounds.laser.play(!isMuted, gameStarted);
            ship.fireCooldown = Math.ceil((Constants.FPS / 2) * ship.fireRate);
        }
        ship.canShoot = false;
    };

    const activateAbility = () => {
        const game = gameRef.current;
        const ship = game.ship;
        if (ship.dead || ship.abilityCooldown > 0) return;

        const isMobile = window.innerWidth < 768;
        const balancingFactor = isMobile ? 0.6 : 1.0; // Tone down for mobile

        // Use ship.type instead of shipType prop to prevent closure staleness
        switch (ship.type) {
            case 'INTERCEPTOR':
                // Triple Burst
                for (let i = -1; i <= 1; i++) {
                    ship.lasers.push({
                        x: ship.x,
                        y: ship.y,
                        xv: Constants.LASER_SPD * Math.cos(ship.a + i * 0.2) / Constants.FPS,
                        yv: -Constants.LASER_SPD * Math.sin(ship.a + i * 0.2) / Constants.FPS,
                        dist: 0,
                        explodeTime: 0,
                        r: Constants.LASER_SIZE * ship.laserSize
                    });
                }
                game.sounds.laser.play(!isMuted, gameStarted);
                break;
            case 'VINDICATOR':
                // Gravity Wave: Push asteroids away
                game.roids.forEach(roid => {
                    const dist = Constants.distBetweenPoints(ship.x, ship.y, roid.x, roid.y);
                    const pushDist = 300 * balancingFactor;
                    if (dist < pushDist) {
                        const angle = Math.atan2(roid.y - ship.y, roid.x - ship.x);
                        roid.xv += Math.cos(angle) * 10 * balancingFactor;
                        roid.yv += Math.sin(angle) * 10 * balancingFactor;
                    }
                });
                ship.abilityActive = true;
                ship.abilityTimer = 10; // Visual flash
                break;
            case 'PHALANX':
                // Static Shield
                ship.abilityActive = true;
                ship.abilityTimer = Math.ceil(2 * Constants.FPS * (isMobile ? 0.75 : 1.0)); // Shorter duration on mobile
                break;
            case 'SCOUT':
                // Sudden Acceleration (Boost)
                const boostPower = 5 * balancingFactor; // Reduced impulse force
                ship.thrust.x += Math.cos(ship.a) * boostPower;
                ship.thrust.y -= Math.sin(ship.a) * boostPower;

                ship.abilityActive = true;
                ship.abilityTimer = 10;
                break;
            case 'WRAITH':
                // Stealth
                ship.abilityActive = true;
                ship.abilityTimer = Math.ceil(4 * Constants.FPS * (isMobile ? 0.75 : 1.0)); // Shorter duration on mobile
                break;
            default: break;
        }

        ship.abilityCooldown = Math.ceil((ship.ability.cd / 1000) * Constants.FPS);
    };

    const destroyAsteroid = (index) => {
        const game = gameRef.current;
        const roid = game.roids[index];
        const x = roid.x;
        const y = roid.y;
        const r = roid.r;
        const size = roid.size;

        if (size === 3) { // Large -> Medium
            game.roids.push(newAsteroid(x, y, Math.ceil(r / 2), 2));
            game.roids.push(newAsteroid(x, y, Math.ceil(r / 2), 2));
            game.score += Constants.ROID_PTS_LGE;
        } else if (size === 2) { // Medium -> Small
            game.roids.push(newAsteroid(x, y, Math.ceil(r / 2), 1));
            game.roids.push(newAsteroid(x, y, Math.ceil(r / 2), 1));
            game.score += Constants.ROID_PTS_MED;
        } else {
            game.score += Constants.ROID_PTS_SML;
        }

        game.roids.splice(index, 1);
        game.sounds.hit.play(!isMuted, gameStarted);
        createExplosion(x, y, "grey", 15); // Asteroid dust
        createExplosion(x, y, "white", 5);
        game.roidsLeft--;
        game.sounds.music.setAsteroidRatio(game.roidsLeft / game.roidsTotal);

        if (game.roids.length === 0 && game.enemies.length === 0) {
            game.level++;
            startNewLevel();
        }
    };

    const destroyEnemy = (index) => {
        const game = gameRef.current;
        const enemy = game.enemies[index];
        game.score += enemy.type === 'HEXAGON' ? 500 : 250;
        createExplosion(enemy.x, enemy.y, enemy.type === 'HEXAGON' ? "lime" : "red", 20);
        game.enemies.splice(index, 1);
        game.sounds.hit.play(!isMuted, gameStarted);

        if (game.roids.length === 0 && game.enemies.length === 0) {
            game.level++;
            startNewLevel();
        }
    };

    const createExplosion = (x, y, color = "white", count = 10) => {
        const game = gameRef.current;
        for (let i = 0; i < count; i++) {
            game.explosions.push({
                x: x,
                y: y,
                xv: (Math.random() - 0.5) * (Math.random() * 10),
                yv: (Math.random() - 0.5) * (Math.random() * 10),
                age: 0,
                life: Math.random() * 20 + 10, // Frames
                color: color
            });
        }
    };

    const explodeShip = () => {
        const game = gameRef.current;
        game.ship.explodeTime = Math.ceil(Constants.SHIP_EXPLODE_DUR * Constants.FPS);
        game.sounds.explode.play(!isMuted, gameStarted);
        createExplosion(game.ship.x, game.ship.y, "red", 30);
        createExplosion(game.ship.x, game.ship.y, "white", 20);
    };

    const handleGameOverState = () => {
        const game = gameRef.current;
        game.ship.dead = true;
        game.text = "Game Over";
        game.textAlpha = 1.0;
        saveToLeaderboard(playerName, game.score, isVerified);

        setTimeout(() => {
            onGameOver(game.score);
        }, 3000);
    };

    const drawShip = (ctx, x, y, a, r, colour = "white") => {
        ctx.strokeStyle = colour;
        ctx.lineWidth = Constants.SHIP_SIZE / 20;
        ctx.beginPath();

        // Use ship.type if available, otherwise fall back or use prop (for lives display)
        // For game ship, use ship.type. For lives, use shipType prop or "CLASSIC"
        const typeToDraw = (gameRef.current.ship && gameRef.current.ship.type) ? gameRef.current.ship.type : shipType;
        const design = SHIP_DESIGNS[typeToDraw] || SHIP_DESIGNS.CLASSIC;

        design.draw(ctx, x, y, a, r);

        ctx.closePath();
        ctx.stroke();
    };

    const update = () => {
        if (!gameStarted || !canvasRef.current || !gameRef.current.ship) return;

        const canv = canvasRef.current;
        const ctx = canv.getContext("2d");
        const game = gameRef.current;
        const ship = game.ship;

        const blinkOn = ship.blinkNum % 2 === 0;
        const exploding = ship.explodeTime > 0;

        game.sounds.music.tick(!isMuted, gameStarted);

        // Draw Space
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canv.width, canv.height);

        // Draw Explosions
        for (let i = game.explosions.length - 1; i >= 0; i--) {
            const p = game.explosions[i];
            p.x += p.xv;
            p.y += p.yv;
            p.age++;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = 1 - (p.age / p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            if (p.age >= p.life) game.explosions.splice(i, 1);
        }

        // Draw Enemies
        for (let i = 0; i < game.enemies.length; i++) {
            const enemy = game.enemies[i];
            const x = enemy.x, y = enemy.y, r = enemy.r, type = enemy.type;

            ctx.lineWidth = Constants.SHIP_SIZE / 20;
            if (type === 'SQUARE') {
                ctx.strokeStyle = enemy.isElite ? "#a855f7" : "red"; // Purple for Elite
                ctx.strokeRect(x - r, y - r, r * 2, r * 2);
            } else {
                ctx.strokeStyle = "lime";
                ctx.beginPath();
                for (let j = 0; j < 6; j++) {
                    const ang = j * Math.PI / 3;
                    ctx.lineTo(x + r * Math.cos(ang), y + r * Math.sin(ang));
                }
                ctx.closePath();
                ctx.stroke();
            }

            // Health Bar for Hexagons and Elite Squares
            if (enemy.maxHealth > 1) {
                const barW = r * 2;
                const barH = 5;
                ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
                ctx.fillRect(x - r, y - r - 15, barW, barH);
                ctx.fillStyle = type === 'HEXAGON' ? "lime" : "#a855f7";
                ctx.fillRect(x - r, y - r - 15, barW * (enemy.health / enemy.maxHealth), barH);
            }
        }

        // Enemy Lasers
        for (let i = game.enemyLasers.length - 1; i >= 0; i--) {
            const l = game.enemyLasers[i];
            l.x += l.xv;
            l.y += l.yv;
            l.dist += Math.sqrt(l.xv * l.xv + l.yv * l.yv);

            if (l.dist > canv.width) {
                game.enemyLasers.splice(i, 1);
                continue;
            }

            // Enhanced Enemy Laser
            ctx.shadowBlur = 10;
            ctx.shadowColor = l.isElite ? "#a855f7" : "red";
            ctx.fillStyle = "white";
            ctx.beginPath(); ctx.arc(l.x, l.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Collision with ship
            if (!exploding && ship.blinkNum === 0 && !ship.dead && Constants.distBetweenPoints(ship.x, ship.y, l.x, l.y) < ship.r) {
                explodeShip();
                game.enemyLasers.splice(i, 1);
            }
        }

        // Draw Asteroids
        for (let i = 0; i < game.roids.length; i++) {
            ctx.strokeStyle = "slategrey";
            ctx.fillStyle = "white"; // Filled with white as requested
            ctx.lineWidth = Constants.SHIP_SIZE / 20;
            const r = game.roids[i].r, x = game.roids[i].x, y = game.roids[i].y, a = game.roids[i].a, offs = game.roids[i].offs, vert = game.roids[i].vert;
            ctx.beginPath();
            ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
            for (let j = 1; j < vert; j++) {
                ctx.lineTo(x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert), y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert));
            }
            ctx.closePath();
            ctx.fill(); // Fill the asteroid
            ctx.stroke();

            // Move the asteroid
            game.roids[i].x += game.roids[i].xv;
            game.roids[i].y += game.roids[i].yv;

            // Handle edge of screen
            if (game.roids[i].x < 0 - game.roids[i].r) {
                game.roids[i].x = canv.width + game.roids[i].r;
            } else if (game.roids[i].x > canv.width + game.roids[i].r) {
                game.roids[i].x = 0 - game.roids[i].r;
            }
            if (game.roids[i].y < 0 - game.roids[i].r) {
                game.roids[i].y = canv.height + game.roids[i].r;
            } else if (game.roids[i].y > canv.height + game.roids[i].r) {
                game.roids[i].y = 0 - game.roids[i].r;
            }
        }

        // Enemy Shooting & Movement
        for (let i = 0; i < game.enemies.length; i++) {
            const enemy = game.enemies[i];
            enemy.x += enemy.xv;
            enemy.y += enemy.yv;

            // Edge wrap
            if (enemy.x < -enemy.r) enemy.x = canv.width + enemy.r; else if (enemy.x > canv.width + enemy.r) enemy.x = -enemy.r;
            if (enemy.y < -enemy.r) enemy.y = canv.height + enemy.r; else if (enemy.y > canv.height + enemy.r) enemy.y = -enemy.r;

            if (enemy.type === 'SQUARE') {
                enemy.shootTime--;
                // Wraith Stealth Logic: Enemies don't target if stealth is active
                const isWraithStealth = ship.type === 'WRAITH' && ship.abilityActive;

                if (enemy.shootTime <= 0 && !isWraithStealth) {
                    // Aim at player: Elite is more precise (lower error)
                    const error = enemy.isElite ? 0.15 : 0.4;
                    const ang = Math.atan2(ship.y - enemy.y, ship.x - enemy.x) + (Math.random() * error - error / 2);
                    game.enemyLasers.push({
                        x: enemy.x,
                        y: enemy.y,
                        xv: Math.cos(ang) * Constants.LASER_SPD * 0.5 / Constants.FPS,
                        yv: Math.sin(ang) * Constants.LASER_SPD * 0.5 / Constants.FPS,
                        dist: 0,
                        isElite: enemy.isElite
                    });
                    enemy.shootTime = Math.floor(Math.random() * 150) + 100;
                }
            }
        }

        // Ship Physics
        if (ship.thrusting && !ship.dead) {
            ship.thrust.x += ship.accel * Math.cos(ship.a) / Constants.FPS;
            ship.thrust.y -= ship.accel * Math.sin(ship.a) / Constants.FPS;
            game.sounds.thrust.play(!isMuted, gameStarted);
            if (!exploding && blinkOn) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = Constants.SHIP_SIZE / 20;
                ctx.beginPath();
                ctx.moveTo(ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a)));
                ctx.lineTo(ship.x - ship.r * 5 / 3 * Math.cos(ship.a), ship.y + ship.r * 5 / 3 * Math.sin(ship.a));
                ctx.lineTo(ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a)));
                ctx.closePath();
                ctx.stroke();
            }
        } else {
            ship.thrust.x -= Constants.FRICTION * ship.thrust.x / Constants.FPS;
            ship.thrust.y -= Constants.FRICTION * ship.thrust.y / Constants.FPS;
            game.sounds.thrust.stop();
        }

        if (!exploding) {
            if (blinkOn && !ship.dead) {
                // Dim ship if stealth is active
                if (ship.type === 'WRAITH' && ship.abilityActive) ctx.globalAlpha = 0.3;
                drawShip(ctx, ship.x, ship.y, ship.a, ship.r);
                ctx.globalAlpha = 1.0;

                // Draw Phalanx Shield
                if (ship.type === 'PHALANX' && ship.abilityActive) {
                    ctx.strokeStyle = "cyan";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(ship.x, ship.y, ship.r * 1.8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
                    ctx.fill();
                }
            }
            if (ship.blinkNum > 0) {
                ship.blinkTime--;
                if (ship.blinkTime === 0) {
                    ship.blinkTime = Math.ceil(Constants.SHIP_BLINK_DUR * Constants.FPS);
                    ship.blinkNum--;
                }
            }
            ship.a += ship.rot;
            ship.x += ship.thrust.x;
            ship.y += ship.thrust.y;

            // Handle Stats/Ability Timers
            if (ship.fireCooldown > 0) ship.fireCooldown--;
            if (ship.abilityCooldown > 0) ship.abilityCooldown--;
            if (ship.abilityActive) {
                ship.abilityTimer--;
                if (ship.abilityTimer <= 0) ship.abilityActive = false;
            }

            // Edge wrap
            if (ship.x < -ship.r) ship.x = canv.width + ship.r; else if (ship.x > canv.width + ship.r) ship.x = -ship.r;
            if (ship.y < -ship.r) ship.y = canv.height + ship.r; else if (ship.y > canv.height + ship.r) ship.y = -ship.r;

            // Collision detection ship vs asteroids
            if (!exploding && ship.blinkNum === 0 && !ship.dead && !ship.abilityActive) {
                for (let i = 0; i < game.roids.length; i++) {
                    if (Constants.distBetweenPoints(ship.x, ship.y, game.roids[i].x, game.roids[i].y) < ship.r + game.roids[i].r) {
                        explodeShip();
                        destroyAsteroid(i);
                        break;
                    }
                }
            }

            // Shield collision (special case for Phalanx)
            if (ship.type === 'PHALANX' && ship.abilityActive) {
                for (let i = game.roids.length - 1; i >= 0; i--) {
                    if (Constants.distBetweenPoints(ship.x, ship.y, game.roids[i].x, game.roids[i].y) < ship.r * 1.8 + game.roids[i].r) {
                        destroyAsteroid(i);
                    }
                }
            }

            // Handle Player Lasers (Movement, Drawing, Collisions)
            for (let i = ship.lasers.length - 1; i >= 0; i--) {
                const l = ship.lasers[i];
                l.x += l.xv;
                l.y += l.yv;
                l.dist += Math.sqrt(l.xv * l.xv + l.yv * l.yv);

                // Check distance limit
                if (l.dist > Constants.LASER_DIST * canv.width) {
                    ship.lasers.splice(i, 1);
                    continue;
                }

                // Draw Laser (Plasma Bolt Style)
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#ff0000"; // Neon Red Glow
                ctx.fillStyle = "#ffffff"; // White Hot Core
                ctx.beginPath();
                ctx.arc(l.x, l.y, l.r || Constants.LASER_SIZE, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Collision: Asteroids
                let hit = false;
                for (let j = game.roids.length - 1; j >= 0; j--) {
                    if (Constants.distBetweenPoints(l.x, l.y, game.roids[j].x, game.roids[j].y) < game.roids[j].r) {
                        destroyAsteroid(j);
                        ship.lasers.splice(i, 1);
                        hit = true;
                        break;
                    }
                }
                if (hit) continue;

                // Collision: Enemies
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    const e = game.enemies[j];
                    if (Constants.distBetweenPoints(l.x, l.y, e.x, e.y) < e.r) {
                        e.health--;
                        ship.lasers.splice(i, 1);
                        if (e.health <= 0) {
                            destroyEnemy(j);
                        }
                        break;
                    }
                }
            }
        } else {
            // Explosion handled in previous block
            ctx.fillStyle = "darkred";
            ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "red";
            ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "orange";
            ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "yellow";
            ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "white";
            ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2); ctx.fill();

            ship.explodeTime--;
            if (ship.explodeTime === 0) {
                game.lives--;
                if (game.lives === 0) handleGameOverState();
                else game.ship = newShip();
            }
        }

        // TEXT (LEVEL, GAME OVER)
        if (game.textAlpha > 0) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255, 255, 255, " + game.textAlpha + ")";
            ctx.font = "small-caps " + Constants.TEXT_SIZE + "px 'DejaVu Sans Mono'";
            ctx.fillText(game.text, canv.width / 2, canv.height * 0.75);
            game.textAlpha -= (1.0 / Constants.TEXT_FADE_TIME / Constants.FPS);
        }

        // LIVES
        for (let i = 0; i < game.lives; i++) {
            const colour = (exploding && i === game.lives - 1) ? "red" : "white";
            drawShip(ctx, Constants.SHIP_SIZE + i * Constants.SHIP_SIZE * 1.2, Constants.SHIP_SIZE * 1.5, Math.PI / 2, Constants.SHIP_SIZE / 2, colour);
        }

        // SCORE
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = Constants.TEXT_SIZE + "px 'DejaVu Sans Mono'";
        ctx.fillText(game.score, canv.width - Constants.SHIP_SIZE / 2, Constants.SHIP_SIZE);

        // EXTRA HUD (ABILITY COOLDOWN)
        if (!ship.dead) {
            const barW = 100;
            const barH = 6;
            const xHUD = 20;
            const yHUD = 70;

            // Cooldown background
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(xHUD, yHUD, barW, barH);

            // Cooldown progress
            const cdTotal = (ship.ability.cd / 1000) * Constants.FPS;
            const cdLeft = ship.abilityCooldown;
            const progress = (cdTotal - cdLeft) / cdTotal;

            ctx.fillStyle = progress < 1 ? "rgba(79, 172, 254, 0.5)" : "#4facfe";
            ctx.fillRect(xHUD, yHUD, barW * progress, barH);

            ctx.fillStyle = "white";
            ctx.font = "10px 'DejaVu Sans Mono'";
            ctx.textAlign = "left";
            ctx.fillText(ship.ability.name.toUpperCase(), xHUD, yHUD - 5);
        }
    };

    return <canvas ref={canvasRef} id="gameCanvas" />;
};

export default GameCanvas;
