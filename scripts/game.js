// Game Constants
const FPS = 30;
const FRICTION = 0.7;
const GAME_LIVES = 3;
const LASER_DIST = 0.6;
const LASER_EXPLODE_DUR = 0.1;
const LASER_MAX = 10;
const LASER_SPD = 500;
const ROID_JAG = 0.4;
const ROID_PTS_LGE = 20;
const ROID_PTS_MED = 50;
const ROID_PTS_SML = 100;
const ROID_NUM = 3;
const ROID_SIZE = 100;
const ROID_SPD = 50;
const ROID_VERT = 10;
const SAVE_KEY_LEADERBOARD = "asteroid_leaderboard";
const SHIP_BLINK_DUR = 0.1;
const SHIP_EXPLODE_DUR = 0.3;
const SHIP_INV_DUR = 3;
const SHIP_SIZE = 30;
const SHIP_THRUST = 5;
const SHIP_TURN_SPD = 360;
const SHOW_BOUNDING = false;
const SHOW_CENTRE_DOT = false;
var MUSIC_ON_SETTING = true;
var SOUND_ON_SETTING = true;
const TEXT_FADE_TIME = 2.5;
const TEXT_SIZE = 40;

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");

// Game variables
var level, lives, roids, score, ship, text, textAlpha;
var roidsLeft, roidsTotal;
var gameStarted = false;
var playerName = "PLAYER";

// Leaderboard Logic
function getLeaderboard() {
    const data = localStorage.getItem(SAVE_KEY_LEADERBOARD);
    return data ? JSON.parse(data) : [];
}

function saveToLeaderboard(name, score) {
    let leaderboard = getLeaderboard();
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 50); // Keep top 50
    localStorage.setItem(SAVE_KEY_LEADERBOARD, JSON.stringify(leaderboard));
    updateLeaderboardUI();
}

function updateLeaderboardUI() {
    const miniList = document.getElementById("mini-leaderboard-list");
    const fullList = document.getElementById("leaderboard-list");
    const leaderboard = getLeaderboard();

    // Top 5 Mini Preview
    if (miniList) {
        miniList.innerHTML = leaderboard.slice(0, 5).map((entry, idx) => `
            <div class="mini-entry">
                <span class="rank-num">#${idx + 1}</span>
                <span class="rank-name">${entry.name}</span>
                <span class="rank-score">${entry.score}</span>
            </div>
        `).join('') || '<div class="mini-entry">NO DATA</div>';
    }

    // Top 50 Full List
    if (fullList) {
        fullList.innerHTML = leaderboard.map((entry, idx) => `
            <div class="leaderboard-entry">
                <span class="rank-num">#${idx + 1}</span>
                <span class="rank-name">${entry.name}</span>
                <span class="rank-score">${entry.score}</span>
            </div>
        `).join('') || '<div class="leaderboard-entry">NO DATA</div>';
    }
}

// Sound and Music Classes (Adapted for modern browsers)
function Music(srcLow, srcHigh) {
    this.soundLow = new Audio(srcLow);
    this.soundHigh = new Audio(srcHigh);
    this.low = true;
    this.tempo = 1.0;
    this.beatTime = 0;

    this.play = function () {
        if (MUSIC_ON_SETTING && gameStarted) {
            try {
                if (this.low) this.soundLow.play();
                else this.soundHigh.play();
                this.low = !this.low;
            } catch (e) { }
        }
    }

    this.setAsteroidRatio = function (ratio) {
        this.tempo = 1.0 - 0.75 * (1.0 - ratio);
    }

    this.tick = function () {
        if (this.beatTime == 0) {
            this.play();
            this.beatTime = Math.ceil(this.tempo * FPS);
        } else {
            this.beatTime--;
        }
    }
}

function Sound(src, maxStreams = 1, vol = 1.0) {
    this.streamNum = 0;
    this.streams = [];
    for (var i = 0; i < maxStreams; i++) {
        this.streams.push(new Audio(src));
        this.streams[i].volume = vol;
    }

    this.play = function () {
        if (SOUND_ON_SETTING && gameStarted) {
            try {
                this.streamNum = (this.streamNum + 1) % maxStreams;
                this.streams[this.streamNum].play();
            } catch (e) { }
        }
    }

    this.stop = function () {
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0;
    }
}

// Set up sounds
var fxExplode = new Sound("sounds/explode.m4a");
var fxHit = new Sound("sounds/hit.m4a", 5);
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.5);
var fxThrust = new Sound("sounds/thrust.m4a");
var music = new Music("sounds/music-low.m4a", "sounds/music-high.m4a");

// Initial UI
// Initial UI
updateLeaderboardUI();

// Audio Toggle Logic
const muteBtn = document.getElementById("mute-btn");
muteBtn.addEventListener("click", () => {
    MUSIC_ON_SETTING = !MUSIC_ON_SETTING;
    SOUND_ON_SETTING = !SOUND_ON_SETTING;

    if (MUSIC_ON_SETTING) {
        muteBtn.innerText = "🔊";
        muteBtn.classList.remove("muted");
    } else {
        muteBtn.innerText = "🔇";
        muteBtn.classList.add("muted");
        if (music) {
            music.soundLow.pause();
            music.soundHigh.pause();
        }
    }
});

// Leaderboard Toggle Logic
const leadersToggle = document.getElementById("leaderboard-toggle");
const closeLeadersBtn = document.getElementById("close-leaderboard");
const leaderboardBox = document.querySelector(".leaderboard-box");

if (leadersToggle && closeLeadersBtn && leaderboardBox) {
    leadersToggle.addEventListener("click", () => {
        leaderboardBox.classList.toggle("active");
    });
    closeLeadersBtn.addEventListener("click", () => {
        leaderboardBox.classList.remove("active");
    });
}

function resizeCanvas() {
    canv.width = window.innerWidth;
    canv.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Game Management
function startGame() {
    if (gameStarted) return;

    const nameInput = document.getElementById("username").value.trim();
    playerName = nameInput || "PLAYER";

    // Audio settings are already handled by the toggle button logic

    if (document.activeElement) document.activeElement.blur();
    document.getElementById("ui-overlay").classList.add("hidden");

    gameStarted = true;

    // Show mobile controls if on small screen
    const mobileControls = document.getElementById("mobile-controls");
    if (mobileControls) mobileControls.classList.add("active");

    newGame();

    // Request full screen on mobile
    if (window.innerWidth < 1024) {
        try {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) docEl.requestFullscreen();
            else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
            else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
            else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
        } catch (e) { }
    }
}

// Allow starting with Enter in the input field
document.getElementById("username").addEventListener("keypress", (ev) => {
    if (ev.key === "Enter") startGame();
});


document.getElementById("start-btn").addEventListener("click", startGame);

function newGame() {
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    ship = newShip();
    newLevel();
}

function newLevel() {
    music.setAsteroidRatio(1);
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt();
}

function createAsteroidBelt() {
    roids = [];
    roidsTotal = (ROID_NUM + level) * 7;
    roidsLeft = roidsTotal;
    var x, y;
    for (var i = 0; i < ROID_NUM + level; i++) {
        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 2)));
    }
}

function newShip() {
    return {
        x: canv.width / 2,
        y: canv.height / 2,
        a: 90 / 180 * Math.PI,
        r: SHIP_SIZE / 2,
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        canShoot: true,
        dead: false,
        explodeTime: 0,
        lasers: [],
        rot: 0,
        thrusting: false,
        thrust: { x: 0, y: 0 }
    }
}

function newAsteroid(x, y, r) {
    var lvlMult = 1 + 0.1 * level;
    var roid = {
        x: x, y: y,
        xv: Math.random() * ROID_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROID_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        a: Math.random() * Math.PI * 2,
        r: r,
        offs: [],
        vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2)
    };
    for (var i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
    }
    return roid;
}

function shootLaser() {
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS,
            yv: -LASER_SPD * Math.sin(ship.a) / FPS,
            dist: 0,
            explodeTime: 0
        });
        fxLaser.play();
    }
    ship.canShoot = false;
}

function destroyAsteroid(index) {
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    if (r == Math.ceil(ROID_SIZE / 2)) {
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
        score += ROID_PTS_LGE;
    } else if (r == Math.ceil(ROID_SIZE / 4)) {
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
        roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
        score += ROID_PTS_MED;
    } else {
        score += ROID_PTS_SML;
    }

    roids.splice(index, 1);
    fxHit.play();
    roidsLeft--;
    music.setAsteroidRatio(roidsLeft / roidsTotal);

    if (roids.length == 0) {
        level++;
        newLevel();
    }
}

function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
    fxExplode.play();
}

function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
    saveToLeaderboard(playerName, score);

    // Show UI overlay again after a short delay
    setTimeout(() => {
        document.getElementById("ui-overlay").classList.remove("hidden");
        gameStarted = false;
    }, 3000);
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = "white") {
    ctx.strokeStyle = colour;
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo(x + 4 / 3 * ship.r * Math.cos(a), y - 4 / 3 * ship.r * Math.sin(a));
    ctx.lineTo(x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)), y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a)));
    ctx.lineTo(x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)), y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a)));
    ctx.closePath();
    ctx.stroke();
}

// Input Handlers
function keyDown(ev) {
    if (!gameStarted || ship.dead) return;
    switch (ev.keyCode) {
        case 32: // Space
            ev.preventDefault(); // Prevent page scroll/button trigger
            shootLaser();
            break;
        case 37: // Left
            ev.preventDefault();
            ship.rot = SHIP_TURN_SPD / 180 * Math.PI / FPS;
            break;
        case 38: // Up
            ev.preventDefault();
            ship.thrusting = true;
            break;
        case 39: // Right
            ev.preventDefault();
            ship.rot = -SHIP_TURN_SPD / 180 * Math.PI / FPS;
            break;
    }
}

function keyUp(ev) {
    if (!gameStarted || ship.dead) return;
    switch (ev.keyCode) {
        case 32: // Space
            ev.preventDefault();
            ship.canShoot = true;
            break;
        case 37: // Left
            ev.preventDefault();
            ship.rot = 0;
            break;
        case 38: // Up
            ev.preventDefault();
            ship.thrusting = false;
            break;
        case 39: // Right
            ev.preventDefault();
            ship.rot = 0;
            break;
    }
}

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// Mobile Button Handlers
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnThrust = document.getElementById("btn-thrust");
const btnShoot = document.getElementById("btn-shoot");

function addTouchListeners(btn, downAction, upAction) {
    btn.addEventListener("touchstart", (e) => {
        if (e.cancelable) e.preventDefault();
        downAction();
    }, { passive: false });
    btn.addEventListener("touchend", (e) => {
        if (e.cancelable) e.preventDefault();
        upAction();
    }, { passive: false });
    btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        downAction();
    });
    btn.addEventListener("mouseup", (e) => {
        e.preventDefault();
        upAction();
    });
}

addTouchListeners(btnLeft, () => ship.rot = SHIP_TURN_SPD / 180 * Math.PI / FPS, () => ship.rot = 0);
addTouchListeners(btnRight, () => ship.rot = -SHIP_TURN_SPD / 180 * Math.PI / FPS, () => ship.rot = 0);
addTouchListeners(btnThrust, () => ship.thrusting = true, () => ship.thrusting = false);
addTouchListeners(btnShoot, () => { shootLaser(); ship.canShoot = true; }, () => { });

// Game Loop
setInterval(update, 1000 / FPS);

function update() {
    if (!gameStarted) return;

    var blinkOn = ship.blinkNum % 2 == 0;
    var exploding = ship.explodeTime > 0;

    music.tick();

    // Draw Space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // Draw Asteroids
    for (var i = 0; i < roids.length; i++) {
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = SHIP_SIZE / 20;
        var r = roids[i].r, x = roids[i].x, y = roids[i].y, a = roids[i].a, offs = roids[i].offs, vert = roids[i].vert;
        ctx.beginPath();
        ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
        for (var j = 1; j < vert; j++) {
            ctx.lineTo(x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert), y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert));
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Ship Physics
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
        fxThrust.play();
        if (!exploding && blinkOn) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = SHIP_SIZE / 20;
            ctx.beginPath();
            ctx.moveTo(ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a)));
            ctx.lineTo(ship.x - ship.r * 5 / 3 * Math.cos(ship.a), ship.y + ship.r * 5 / 3 * Math.sin(ship.a));
            ctx.lineTo(ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a)));
            ctx.closePath();
            ctx.stroke();
        }
    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
        fxThrust.stop();
    }

    if (!exploding) {
        if (blinkOn && !ship.dead) drawShip(ship.x, ship.y, ship.a);
        if (ship.blinkNum > 0) {
            ship.blinkTime--;
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
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
        if (ship.explodeTime == 0) {
            lives--;
            if (lives == 0) gameOver();
            else ship = newShip();
        }
    }

    // Screen Edges
    if (ship.x < 0 - ship.r) ship.x = canv.width + ship.r; else if (ship.x > canv.width + ship.r) ship.x = 0 - ship.r;
    if (ship.y < 0 - ship.r) ship.y = canv.height + ship.r; else if (ship.y > canv.height + ship.r) ship.y = 0 - ship.r;

    // Lasers
    for (var i = ship.lasers.length - 1; i >= 0; i--) {
        if (ship.lasers[i].dist > LASER_DIST * canv.width) { ship.lasers.splice(i, 1); continue; }
        if (ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--;
            if (ship.lasers[i].explodeTime == 0) { ship.lasers.splice(i, 1); continue; }
            ctx.fillStyle = "orangered";
            ctx.beginPath(); ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2); ctx.fill();
        } else {
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
            ctx.fillStyle = "salmon";
            ctx.beginPath(); ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2); ctx.fill();
        }
        if (ship.lasers[i].x < 0) ship.lasers[i].x = canv.width; else if (ship.lasers[i].x > canv.width) ship.lasers[i].x = 0;
        if (ship.lasers[i].y < 0) ship.lasers[i].y = canv.height; else if (ship.lasers[i].y > canv.height) ship.lasers[i].y = 0;
    }

    // Collisions
    for (var i = roids.length - 1; i >= 0; i--) {
        let roid = roids[i];
        if (!roid) continue;

        let asteroidHit = false;
        for (var j = ship.lasers.length - 1; j >= 0; j--) {
            if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(roid.x, roid.y, ship.lasers[j].x, ship.lasers[j].y) < roid.r) {
                destroyAsteroid(i);
                ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
                asteroidHit = true;
                break;
            }
        }

        if (!asteroidHit && !exploding && ship.blinkNum == 0 && !ship.dead && distBetweenPoints(ship.x, ship.y, roid.x, roid.y) < ship.r + roid.r) {
            explodeShip();
            destroyAsteroid(i);
        }
    }

    // Asteroid Movement
    for (var i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv; roids[i].y += roids[i].yv;
        if (roids[i].x < 0 - roids[i].r) roids[i].x = canv.width + roids[i].r; else if (roids[i].x > canv.width + roids[i].r) roids[i].x = 0 - roids[i].r;
        if (roids[i].y < 0 - roids[i].r) roids[i].y = canv.height + roids[i].r; else if (roids[i].y > canv.height + roids[i].r) roids[i].y = 0 - roids[i].r;
    }

    // Text & UI
    if (textAlpha >= 0) {
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    }

    for (var i = 0; i < lives; i++) drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, (exploding && i == lives - 1 ? "red" : "white"));
    ctx.textAlign = "right"; ctx.fillStyle = "white"; ctx.font = TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(score, canv.width - SHIP_SIZE / 2, SHIP_SIZE);
}
