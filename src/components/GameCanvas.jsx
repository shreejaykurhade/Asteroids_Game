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
        }
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
                case 16: // Shift
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
            // Specialized Stats
            accel: Constants.SHIP_THRUST * stats.accel,
            turn: (Constants.SHIP_TURN_SPD * stats.turn) / 180 * Math.PI / Constants.FPS,
            fireRate: stats.fireRate,
            fireCooldown: 0,
            laserSize: stats.laserSize || 1.0,
            // Ability State
            ability: design.ability,
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

        const type = shipType;

        switch (type) {
            case 'INTERCEPTOR':
                // Triple Burst
                for (let i = -1; i <= 1; i++) {
                    ship.lasers.push({
                        x: ship.x,
                        y: ship.y,
                        xv: Constants.LASER_SPD * Math.cos(ship.a + i * 0.2) / Constants.FPS,
                        yv: -Constants.LASER_SPD * Math.sin(ship.a + i * 0.2) / Constants.FPS,
                        dist: 0,
                        explodeTime: 0
                    });
                }
                game.sounds.laser.play(!isMuted, gameStarted);
                break;
            case 'VINDICATOR':
                // Gravity Wave: Push asteroids away
                game.roids.forEach(roid => {
                    const dist = Constants.distBetweenPoints(ship.x, ship.y, roid.x, roid.y);
                    if (dist < 300) {
                        const angle = Math.atan2(roid.y - ship.y, roid.x - ship.x);
                        roid.xv += Math.cos(angle) * 10;
                        roid.yv += Math.sin(angle) * 10;
                    }
                });
                ship.abilityActive = true;
                ship.abilityTimer = 10; // Visual flash
                break;
            case 'PHALANX':
                // Static Shield
                ship.abilityActive = true;
                ship.abilityTimer = Math.ceil(2 * Constants.FPS); // 2s shield
                break;
            case 'SCOUT':
                // Warp Dash
                ship.thrust.x += Math.cos(ship.a) * 50;
                ship.thrust.y -= Math.sin(ship.a) * 50;
                ship.abilityActive = true;
                ship.abilityTimer = 10;
                break;
            case 'WRAITH':
                // Stealth
                ship.abilityActive = true;
                ship.abilityTimer = Math.ceil(4 * Constants.FPS); // 4s stealth
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
        game.enemies.splice(index, 1);
        game.sounds.hit.play(!isMuted, gameStarted);

        if (game.roids.length === 0 && game.enemies.length === 0) {
            game.level++;
            startNewLevel();
        }
    };

    const explodeShip = () => {
        const game = gameRef.current;
        game.ship.explodeTime = Math.ceil(Constants.SHIP_EXPLODE_DUR * Constants.FPS);
        game.sounds.explode.play(!isMuted, gameStarted);
    };

    const handleGameOver = () => {
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

        const design = SHIP_DESIGNS[shipType] || SHIP_DESIGNS.CLASSIC;
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

            ctx.fillStyle = l.isElite ? "#a855f7" : "red";
            ctx.beginPath(); ctx.arc(l.x, l.y, 3, 0, Math.PI * 2); ctx.fill();

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
                const isWraithStealth = shipType === 'WRAITH' && ship.abilityActive;

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
                if (shipType === 'WRAITH' && ship.abilityActive) ctx.globalAlpha = 0.3;
                drawShip(ctx, ship.x, ship.y, ship.a, ship.r);
                ctx.globalAlpha = 1.0;

                // Draw Phalanx Shield
                if (shipType === 'PHALANX' && ship.abilityActive) {
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
        } else {
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
                if (game.lives === 0) handleGameOver();
                else game.ship = newShip();
            }
        }

        // Draw Ability HUD
        if (!ship.dead) {
            const barW = 100;
            const barH = 6;
            const xHUD = 20;
            const yHUD = 70;

            // Background
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fillRect(xHUD, yHUD, barW, barH);

            // Fill
            const cdPerc = ship.abilityCooldown > 0 ? (1 - ship.abilityCooldown / Math.ceil((ship.ability.cd / 1000) * Constants.FPS)) : 1;
            ctx.fillStyle = ship.abilityCooldown > 0 ? "grey" : "gold";
            ctx.fillRect(xHUD, yHUD, barW * cdPerc, barH);

            ctx.fillStyle = "white";
            ctx.font = "10px 'JetBrains Mono'";
            ctx.fillText(ship.ability.name.toUpperCase(), xHUD, yHUD - 5);
        }

        // Screen Edges (Ship)
        if (ship.x < 0 - ship.r) ship.x = canv.width + ship.r; else if (ship.x > canv.width + ship.r) ship.x = 0 - ship.r;
        if (ship.y < 0 - ship.r) ship.y = canv.height + ship.r; else if (ship.y > canv.height + ship.r) ship.y = 0 - ship.r;

        // Lasers (Ship)
        for (let i = ship.lasers.length - 1; i >= 0; i--) {
            if (ship.lasers[i].dist > Constants.LASER_DIST * canv.width) { ship.lasers.splice(i, 1); continue; }
            const laser = ship.lasers[i];
            if (laser.explodeTime > 0) {
                laser.explodeTime--;
                if (laser.explodeTime === 0) { ship.lasers.splice(i, 1); continue; }
                ctx.fillStyle = "orangered";
                ctx.beginPath(); ctx.arc(laser.x, laser.y, ship.r * 0.75, 0, Math.PI * 2); ctx.fill();
            } else {
                laser.x += laser.xv;
                laser.y += laser.yv;
                laser.dist += Math.sqrt(laser.xv * laser.xv + laser.yv * laser.yv);
                ctx.fillStyle = "salmon";
                ctx.beginPath(); ctx.arc(laser.x, laser.y, (Constants.SHIP_SIZE / 15) * ship.laserSize, 0, Math.PI * 2); ctx.fill();

                // Check hit on enemies
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    const enemy = game.enemies[j];
                    if (Constants.distBetweenPoints(laser.x, laser.y, enemy.x, enemy.y) < enemy.r) {
                        enemy.health--;
                        laser.explodeTime = Math.ceil(Constants.LASER_EXPLODE_DUR * Constants.FPS);
                        if (enemy.health <= 0) {
                            destroyEnemy(j);
                        }
                        break;
                    }
                }
            }
            if (laser && laser.x < 0) laser.x = canv.width; else if (laser && laser.x > canv.width) laser.x = 0;
            if (laser && laser.y < 0) laser.y = canv.height; else if (laser && laser.y > canv.height) laser.y = 0;
        }

        // Collisions (Asteroids)
        for (let i = game.roids.length - 1; i >= 0; i--) {
            const roid = game.roids[i];
            if (!roid) continue;

            let asteroidHit = false;
            for (let j = ship.lasers.length - 1; j >= 0; j--) {
                if (ship.lasers[j].explodeTime === 0 && Constants.distBetweenPoints(roid.x, roid.y, ship.lasers[j].x, ship.lasers[j].y) < roid.r) {
                    destroyAsteroid(i);
                    ship.lasers[j].explodeTime = Math.ceil(Constants.LASER_EXPLODE_DUR * Constants.FPS);
                    asteroidHit = true;
                    break;
                }
            }

            if (!asteroidHit && !exploding && ship.blinkNum === 0 && !ship.dead && Constants.distBetweenPoints(ship.x, ship.y, roid.x, roid.y) < ship.r + roid.r) {
                const isShielded = shipType === 'PHALANX' && ship.abilityActive;
                if (!isShielded) {
                    explodeShip();
                    destroyAsteroid(i);
                } else {
                    // Just destroy/push the asteroid if shielded?
                    // Let's destroy it but not explode ship
                    destroyAsteroid(i);
                }
            }
        }

        // Collisions (Enemies vs Ship)
        if (!exploding && ship.blinkNum === 0 && !ship.dead) {
            const isShielded = shipType === 'PHALANX' && ship.abilityActive;
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                if (Constants.distBetweenPoints(ship.x, ship.y, enemy.x, enemy.y) < ship.r + enemy.r) {
                    if (!isShielded) {
                        explodeShip();
                        destroyEnemy(i);
                    } else {
                        destroyEnemy(i);
                    }
                }
            }
        }

        // Asteroid Movement
        for (let i = 0; i < game.roids.length; i++) {
            game.roids[i].x += game.roids[i].xv; game.roids[i].y += game.roids[i].yv;
            if (game.roids[i].x < 0 - game.roids[i].r) game.roids[i].x = canv.width + game.roids[i].r; else if (game.roids[i].x > canv.width + game.roids[i].r) game.roids[i].x = 0 - game.roids[i].r;
            if (game.roids[i].y < 0 - game.roids[i].r) game.roids[i].y = canv.height + game.roids[i].r; else if (game.roids[i].y > canv.height + game.roids[i].r) game.roids[i].y = 0 - game.roids[i].r;
        }

        // Text & UI
        if (game.textAlpha >= 0) {
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255, 255, 255, " + game.textAlpha + ")";
            ctx.font = "small-caps " + Constants.TEXT_SIZE + "px dejavu sans mono";
            ctx.fillText(game.text, canv.width / 2, canv.height * 0.75);
            game.textAlpha -= (1.0 / Constants.TEXT_FADE_TIME / Constants.FPS);
        }

        const uiScale = getScale();
        const shipSize = Constants.SHIP_SIZE * uiScale;
        for (let i = 0; i < game.lives; i++) drawShip(ctx, shipSize + i * shipSize * 1.2, shipSize, 0.5 * Math.PI, ship.r, (exploding && i === game.lives - 1 ? "red" : "white"));
        ctx.textAlign = "right"; ctx.fillStyle = "white"; ctx.font = (Constants.TEXT_SIZE * uiScale) + "px dejavu sans mono";
        ctx.fillText(game.score, canv.width - shipSize / 2, shipSize);
    };

    return (
        <canvas
            id="gameCanvas"
            ref={canvasRef}
        />
    );
};

export default GameCanvas;
