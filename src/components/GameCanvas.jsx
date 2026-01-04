import React, { useRef, useEffect } from 'react';
import * as Constants from '../utils/constants';
import { Music, Sound } from '../utils/audio';
import { saveToLeaderboard } from '../utils/leaderboard';

const GameCanvas = ({ gameStarted, playerName, isVerified, isMuted, onGameOver }) => {
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
                case 37: // Left
                    gameRef.current.ship.rot = Constants.SHIP_TURN_SPD / 180 * Math.PI / Constants.FPS;
                    break;
                case 38: // Up
                    gameRef.current.ship.thrusting = true;
                    break;
                case 39: // Right
                    gameRef.current.ship.rot = -Constants.SHIP_TURN_SPD / 180 * Math.PI / Constants.FPS;
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
    };

    const newShip = () => {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            a: 90 / 180 * Math.PI,
            r: Constants.SHIP_SIZE / 2,
            blinkNum: Math.ceil(Constants.SHIP_INV_DUR / Constants.SHIP_BLINK_DUR),
            blinkTime: Math.ceil(Constants.SHIP_BLINK_DUR * Constants.FPS),
            canShoot: true,
            dead: false,
            explodeTime: 0,
            lasers: [],
            rot: 0,
            thrusting: false,
            thrust: { x: 0, y: 0 }
        };
    };

    const createAsteroidBelt = () => {
        const game = gameRef.current;
        game.roids = [];
        game.roidsTotal = (Constants.ROID_NUM + game.level) * 7;
        game.roidsLeft = game.roidsTotal;
        let x, y;
        for (let i = 0; i < Constants.ROID_NUM + game.level; i++) {
            do {
                x = Math.floor(Math.random() * window.innerWidth);
                y = Math.floor(Math.random() * window.innerHeight);
            } while (Constants.distBetweenPoints(game.ship.x, game.ship.y, x, y) < Constants.ROID_SIZE * 2 + game.ship.r);
            game.roids.push(newAsteroid(x, y, Math.ceil(Constants.ROID_SIZE / 2)));
        }
    };

    const newAsteroid = (x, y, r) => {
        const game = gameRef.current;
        const lvlMult = 1 + 0.1 * game.level;
        const roid = {
            x: x, y: y,
            xv: Math.random() * Constants.ROID_SPD * lvlMult / Constants.FPS * (Math.random() < 0.5 ? 1 : -1),
            yv: Math.random() * Constants.ROID_SPD * lvlMult / Constants.FPS * (Math.random() < 0.5 ? 1 : -1),
            a: Math.random() * Math.PI * 2,
            r: r,
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
        if (ship.canShoot && ship.lasers.length < Constants.LASER_MAX) {
            ship.lasers.push({
                x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
                y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
                xv: Constants.LASER_SPD * Math.cos(ship.a) / Constants.FPS,
                yv: -Constants.LASER_SPD * Math.sin(ship.a) / Constants.FPS,
                dist: 0,
                explodeTime: 0
            });
            game.sounds.laser.play(!isMuted, gameStarted);
        }
        ship.canShoot = false;
    };

    const destroyAsteroid = (index) => {
        const game = gameRef.current;
        const roid = game.roids[index];
        const x = roid.x;
        const y = roid.y;
        const r = roid.r;

        if (r === Math.ceil(Constants.ROID_SIZE / 2)) {
            game.roids.push(newAsteroid(x, y, Math.ceil(Constants.ROID_SIZE / 4)));
            game.roids.push(newAsteroid(x, y, Math.ceil(Constants.ROID_SIZE / 4)));
            game.score += Constants.ROID_PTS_LGE;
        } else if (r === Math.ceil(Constants.ROID_SIZE / 4)) {
            game.roids.push(newAsteroid(x, y, Math.ceil(Constants.ROID_SIZE / 8)));
            game.roids.push(newAsteroid(x, y, Math.ceil(Constants.ROID_SIZE / 8)));
            game.score += Constants.ROID_PTS_MED;
        } else {
            game.score += Constants.ROID_PTS_SML;
        }

        game.roids.splice(index, 1);
        game.sounds.hit.play(!isMuted, gameStarted);
        game.roidsLeft--;
        game.sounds.music.setAsteroidRatio(game.roidsLeft / game.roidsTotal);

        if (game.roids.length === 0) {
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
        ctx.moveTo(x + 4 / 3 * r * Math.cos(a), y - 4 / 3 * r * Math.sin(a));
        ctx.lineTo(x - r * (2 / 3 * Math.cos(a) + Math.sin(a)), y + r * (2 / 3 * Math.sin(a) - Math.cos(a)));
        ctx.lineTo(x - r * (2 / 3 * Math.cos(a) - Math.sin(a)), y + r * (2 / 3 * Math.sin(a) + Math.cos(a)));
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

        // Draw Asteroids
        for (let i = 0; i < game.roids.length; i++) {
            ctx.strokeStyle = "slategrey";
            ctx.lineWidth = Constants.SHIP_SIZE / 20;
            const r = game.roids[i].r, x = game.roids[i].x, y = game.roids[i].y, a = game.roids[i].a, offs = game.roids[i].offs, vert = game.roids[i].vert;
            ctx.beginPath();
            ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
            for (let j = 1; j < vert; j++) {
                ctx.lineTo(x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert), y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert));
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Ship Physics
        if (ship.thrusting && !ship.dead) {
            ship.thrust.x += Constants.SHIP_THRUST * Math.cos(ship.a) / Constants.FPS;
            ship.thrust.y -= Constants.SHIP_THRUST * Math.sin(ship.a) / Constants.FPS;
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
            if (blinkOn && !ship.dead) drawShip(ctx, ship.x, ship.y, ship.a, ship.r);
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

        // Screen Edges
        if (ship.x < 0 - ship.r) ship.x = canv.width + ship.r; else if (ship.x > canv.width + ship.r) ship.x = 0 - ship.r;
        if (ship.y < 0 - ship.r) ship.y = canv.height + ship.r; else if (ship.y > canv.height + ship.r) ship.y = 0 - ship.r;

        // Lasers
        for (let i = ship.lasers.length - 1; i >= 0; i--) {
            if (ship.lasers[i].dist > Constants.LASER_DIST * canv.width) { ship.lasers.splice(i, 1); continue; }
            if (ship.lasers[i].explodeTime > 0) {
                ship.lasers[i].explodeTime--;
                if (ship.lasers[i].explodeTime === 0) { ship.lasers.splice(i, 1); continue; }
                ctx.fillStyle = "orangered";
                ctx.beginPath(); ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2); ctx.fill();
            } else {
                ship.lasers[i].x += ship.lasers[i].xv;
                ship.lasers[i].y += ship.lasers[i].yv;
                ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
                ctx.fillStyle = "salmon";
                ctx.beginPath(); ctx.arc(ship.lasers[i].x, ship.lasers[i].y, Constants.SHIP_SIZE / 15, 0, Math.PI * 2); ctx.fill();
            }
            if (ship.lasers[i].x < 0) ship.lasers[i].x = canv.width; else if (ship.lasers[i].x > canv.width) ship.lasers[i].x = 0;
            if (ship.lasers[i].y < 0) ship.lasers[i].y = canv.height; else if (ship.lasers[i].y > canv.height) ship.lasers[i].y = 0;
        }

        // Collisions
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
                explodeShip();
                destroyAsteroid(i);
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

        for (let i = 0; i < game.lives; i++) drawShip(ctx, Constants.SHIP_SIZE + i * Constants.SHIP_SIZE * 1.2, Constants.SHIP_SIZE, 0.5 * Math.PI, ship.r, (exploding && i === game.lives - 1 ? "red" : "white"));
        ctx.textAlign = "right"; ctx.fillStyle = "white"; ctx.font = Constants.TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(game.score, canv.width - Constants.SHIP_SIZE / 2, Constants.SHIP_SIZE);
    };

    return (
        <canvas
            id="gameCanvas"
            ref={canvasRef}
        />
    );
};

export default GameCanvas;
