'use strict';

class BaseTranslation {
    constructor(options = {}) {
        this.trad = Object.create(null);
        this.symbol = options.symbol || '$';
        this.count = options.count || 1; 
    }
    get(lang, msg, ...args) {
        if (!this.trad[lang]) throw Error(`Language "${lang}" doesn't exist`);
        let output = '';
        if (typeof msg !== 'string') {
            if (!this.trad[lang][msg.msg]) throw Error(`Message "${msg.msg}" doesn't exist`);
            if (!this.trad[lang][msg.msg][msg.sub]) throw Error(`Message "${msg.msg}" exists but sub message "${msg.sub} doesn't exist"`);
            output = this.trad[lang][msg.msg][msg.sub];
        } else {
            if (!this.trad[lang][msg]) throw Error(`Message ${msg} doesn't exist`);
            output = this.trad[lang][msg];
        }
        if (args.length > 1) {
            let i = this.count;
            for (const arg of args) {
                output = output.replace(`${this.symbol}${i}`, arg);
                i++;
            }
        }
        return output;
    }
}

class FileTranslation extends BaseTranslation {
    /**
     * 
     * @param {string} path 
     * @param {options} AnyObject
     */
    constructor(path, options = {}) {
        super(options);
        this.path = path;
        this.load();
    }
    load() {
        // Load file
        let langPack = require(this.path);
        for (let i in langPack) {
            this.trad[i] = langPack[i];
        }
    }
}

class GlobalTranslation extends BaseTranslation {
    constructor(options) {
        super(options);
    }
    add(file) {
		let data = require(file);
		for (let i in data) {
			if (!this.trad[i]) this.trad[i] = data[i];
			else Object.assign(this.trad[i], data[i]);
		}
	}
}

exports.load = function(path, options = {}) {
    return new FileTranslation(path, options);
}
exports.global = new GlobalTranslation();