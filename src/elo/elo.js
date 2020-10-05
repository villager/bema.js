'use strict';

class Elo {
    constructor(k) {
        this.k = k || 32;
    }

    setFactor(k) {
        this.k = k;
    }

    get factor() {
        return this.k;
    }

    getExpected(a, b) {
        return 1 / (1 + Math.pow(10, ((b - a) / 400)));
    }

    update(expected, actual, current) {
        return Math.round(current + this.k * (actual - expected));
    }

}

module.exports = Elo;