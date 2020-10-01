'use strict';

const https = require('https');
const http = require('http');
const url = require('url');

class Net {
    /**
     * @param {string} url 
     */
    constructor(uri) {
        this.url = uri;
        this.protocol = url.parse(this.url).protocol;
    }
    get() {
        const net = this.protocol === 'https' ? https : http;
        return new Promise((resolve, reject) => {
            net.get(this.url, res => {
                res.setEncoding('utf-8');
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(data);
                });
                res.on('error', err => {
                    reject(err);
                });
            }).on('error', err => {
                reject(err);
            }).setTimeout(3500);
        });
    }
    async toJSON() {
        try {
            const data = await this.get();
            return JSON.parse(data);
        } catch(e) {
            return e;
        }
    }
    request(opts = {}) {
		const net = this.protocol === 'https:' ? https : http;
		const actionUrl = url.parse(this.url);
		const hostname = actionUrl.hostname;
		const options = {
			hostname: hostname,
			method: 'POST',
		};
		for (let i in opts) {
			options[i] = opts[i];
		}
        if (!options.hostname) options.hostname = hostname;
        return new Promise((resolve, reject) => {
			let str = '';
			const req = net.request(options, res => {
				res.setEncoding('utf8');
				res.on('data', chunk => {
					str += chunk;
				});
				res.on('end', () => {
					resolve(str);
				});
			});
			req.on('error', e => {
				reject(e);
			});
			if (options.data) req.write(options.data);
			req.end();
		});
    }
}

module.exports = function(uri) {
    return new Net(uri);
}