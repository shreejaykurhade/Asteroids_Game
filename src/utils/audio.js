import { FPS } from './constants';

export class Music {
    constructor(srcLow, srcHigh) {
        this.soundLow = new Audio(srcLow);
        this.soundHigh = new Audio(srcHigh);
        this.low = true;
        this.tempo = 1.0;
        this.beatTime = 0;
    }

    play(enabled, gameStarted) {
        if (enabled && gameStarted) {
            try {
                if (this.low) this.soundLow.play();
                else this.soundHigh.play();
                this.low = !this.low;
            } catch (e) { }
        }
    }

    setAsteroidRatio(ratio) {
        this.tempo = 1.0 - 0.75 * (1.0 - ratio);
    }

    tick(enabled, gameStarted) {
        if (this.beatTime <= 0) {
            this.play(enabled, gameStarted);
            this.beatTime = Math.ceil(this.tempo * FPS);
        } else {
            this.beatTime--;
        }
    }
}

export class Sound {
    constructor(src, maxStreams = 1, vol = 1.0) {
        this.streamNum = 0;
        this.streams = [];
        for (let i = 0; i < maxStreams; i++) {
            this.streams.push(new Audio(src));
            this.streams[i].volume = vol;
        }
    }

    play(enabled, gameStarted) {
        if (enabled && gameStarted) {
            try {
                this.streamNum = (this.streamNum + 1) % this.streams.length;
                this.streams[this.streamNum].play();
            } catch (e) { }
        }
    }

    stop() {
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0;
    }
}
