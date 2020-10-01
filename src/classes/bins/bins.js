'use strict';

const Net = require('../net');

const WHITE_LIST = ['https://hastebin.com', 'https://pastie.io'];

class Bin {
    constructor(url) {
        this.url = url;
    }
	async upload(toUpload) {
        try {
            const chunk = await Net(this.url).request({
                path: '/documents',
                data: toUpload,
            });
            try {
                const linkStr = this.url + '/' + JSON.parse(chunk.toString())['key'];
                return linkStr;
            } catch (err) {
                return err;
            }
        } catch (e) {
            return e;
        }
    }
    async download(key) {
        const url = this.url + key;
        try {
            return await Net(url).get();
        } catch (e) {
            return e;
        }
	}
}
async function upload(toUpload) {
    try {
        return await Hastebin.upload(toUpload);
    } catch (e) {
        try {
            return await Pastie.upload(toUpload);
        } catch (err) {
            return err;
        }
    }
}
async function download(key) {
    try {
        return await Hastebin.download(key);
    } catch (e) {
        try {
            return await Pastie.download(key);
        } catch (err) {
            return err;
        }
    }
}
module.exports = {
    Hastebin: new Bin(WHITE_LIST[0]),
    Pastie: new Bin(WHITE_LIST[1]),
    upload,
    download,
};