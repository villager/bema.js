'use strict';

const fs = require('fs');
const fsPromises = require('fs/promises');

class FSPath {
    /**
     * @param {string} path
     */
    constructor(path) {
        this.path = path;
    }
    async stat() {
        try {
            return await fsPromises.stat(this.path);
        } catch(e) {
            return e;
        }
    }
    async isFile() {
        try {
            return await this.stat().isFile();
        } catch(e) {
            return e;
        }
    }
    async isDirectory() {
        try {
            return await this.stat().isDirectory();
        } catch(e) {
            return e;
        }
    }
    isFileSync() {
		return fs.statSync(this.path).isFile();
	}

	isDirectorySync() {
		return fs.statSync(this.path).isDirectory();
	}
	async read(/** @type {AnyObject | string} */ options = {}) {
        try {
            return await fsPromises.readFile(this.path, options);
        } catch (e) {
            return e;
        }
    }
    readSync(/** @type {AnyObject | string} */ options = {}) {
		return fs.readFileSync(this.path, options);
	}
	/**
	 * @return {Promise<string>}
	 */
	async readExists() {
        try {
            return await fsPromises.readFile(this.path, 'utf-8');
        } catch (e) {
            if (e && e.code === 'ENOENT') return '';
            return e;
        }
	}
	readExistsSync() {
		try {
			return fs.readFileSync(this.path, 'utf8');
		} catch (err) {
			if (err.code !== 'ENOENT') throw err;
		}
		return '';
	}
	/**
	 * @param {string | Buffer} data
	 * @param {Object} options
	 */
	async write(data, options = {}) {
        try {
            return await fsPromises.writeFile(this.path, data, options);
        } catch (e) {
            return e;
        }
	}
	/**
	 * @param {string | Buffer} data
	 * @param {Object} options
	 */
	writeSync(data, options = {}) {
		return fs.writeFileSync(this.path, data, options);
	}
	/**
	 * Writes to a new file before renaming to replace an old file. If
	 * the process crashes while writing, the old file won't be lost.
	 * Does not protect against simultaneous writing; use writeUpdate
	 * for that.
	 *
	 * @param {string | Buffer} data
	 * @param {Object} options
	 */
	async safeWrite(data, options = {}) {
		/* eslint-disable no-use-before-define*/
		await FS(this.path + '.NEW').write(data, options);
		await FS(this.path + '.NEW').rename(this.path);
		/* eslint-enable no-use-before-define*/
	}
	/**
	 * @param {string | Buffer} data
	 * @param {Object} options
	 */
	safeWriteSync(data, options = {}) {
		/* eslint-disable no-use-before-define*/
		FS(this.path + '.NEW').writeSync(data, options);
		FS(this.path + '.NEW').renameSync(this.path);
		/* eslint-enable no-use-before-define*/
	}
	/**
	 * Safest way to update a file with in-memory state. Pass a callback
	 * that fetches the data to be written. It will write an update,
	 * avoiding race conditions. The callback may not necessarily be
	 * called, if `writeUpdate` is called many times in a short period.
	 *
	 * `options.throttle`, if it exists, will make sure updates are not
	 * written more than once every `options.throttle` milliseconds.
	 *
	 * No synchronous version because there's no risk of race conditions
	 * with synchronous code; just use `safeWriteSync`.
	 *
	 * DO NOT do anything with the returned Promise; it's not meaningful.
	 *
	 * @param {() => string | Buffer} dataFetcher
	 * @param {Object} options
	 */
	async writeUpdate(dataFetcher, options) {
		const pendingUpdate = FS.pendingUpdates.get(this.path);
		if (pendingUpdate) {
			pendingUpdate[1] = dataFetcher;
			pendingUpdate[2] = options;
			return;
		}
		let pendingFetcher = /** @type {(() => string | Buffer)?} */ dataFetcher;
		while (pendingFetcher) {
			let updatePromise = this.safeWrite(pendingFetcher(), options);
			FS.pendingUpdates.set(this.path, [updatePromise, null, options]);
			await updatePromise;
			if (options.throttle) {
				await new Promise(resolve => setTimeout(resolve, options.throttle));
			}
			if (!pendingUpdate) return;
			[updatePromise, pendingFetcher, options] = pendingUpdate;
		}
		FS.pendingUpdates.delete(this.path);
	}
	/**
	 * @param {string | Buffer} data
	 * @param {Object} options
	 */
	async append(data, options = {}) {
        try {
            return await fsPromises.appendFile(this.path, data, options);
        } catch (e) {
            return e;
        }
	}
	/**
	 * @param {string | Buffer} data
	 * @param {Object} options
	 */
	appendSync(data, options = {}) {
		return fs.appendFileSync(this.path, data, options);
	}
	/**
	 * @param {string} target
	 */
	async symlinkTo(target) {
        try {
            return await fsPromises.symlink(target, this.path);
        } catch (e) {
            return e;
        }
	}
	/**
	 * @param {string} target
	 */
	symlinkToSync(target) {
		return fs.symlinkSync(target, this.path);
	}
	/**
	 * @param {string} target
	 */
	async rename(target) {
        try {
            return await fsPromises.rename(this.path, target);
        } catch (e) {
            return e;
        }
	}
	/**
	 * @param {string} target
	 */
	renameSync(target) {
		return fs.renameSync(this.path, target);
	}
	async readdir() {
        try {
            return await fsPromises.readdir(this.path);
        } catch (e) {
            return e;
        }
	}
	readdirSync() {
		return fs.readdirSync(this.path);
	}
	/**
	 * @return {NodeJS.WritableStream}
	 */
	createWriteStream(options = {}) {
		return fs.createWriteStream(this.path, options);
	}
	/**
	 * @return {NodeJS.WritableStream}
	 */
	createAppendStream(options = {}) {
		options.flags = options.flags || 'a';
		return fs.createWriteStream(this.path, options);
	}
	async unlinkIfExists() {
        try {
            return await fsPromises.unlink(this.path);
        } catch (e) {
            if (e.code === 'ENOENT') return '';
            return e;
        }
	}
	unlinkIfExistsSync() {
		try {
			fs.unlinkSync(this.path);
		} catch (err) {
			if (err.code !== 'ENOENT') throw err;
		}
	}
	/**
	 * @param {string | number} mode
	 */
	async mkdir(mode = 0o755) {
        try {
            return await fsPromises.mkdir(this.path, mode);
        } catch (e) {
            return e;
        }
	}
	/**
	 * @param {string | number} mode
	 */
	mkdirSync(mode = 0o755) {
		return fs.mkdirSync(this.path, mode);
	}
	/**
	 * @param {string | number} mode
	 */
	async mkdirIfNonexistent(mode = 0o755) {
        try {
            return await fsPromises.mkdir(this.path, mode);
        } catch (e) {
            if (e.code === 'EEXIST') return '';
            return e;
        }
	}
	/**
	 * @param {string | number} mode
	 */
	mkdirIfNonexistentSync(mode = 0o755) {
		try {
			fs.mkdirSync(this.path, mode);
		} catch (err) {
			if (err.code !== 'EEXIST') throw err;
		}
	}
	/**
	 * Creates the directory (and any parent directories if necessary).
	 * Does not throw if the directory already exists.
	 * @param {string | number} mode
	 */
	async mkdirp(mode = 0o755) {
		try {
			await this.mkdirIfNonexistent(mode);
		} catch (err) {
			if (err.code !== 'ENOENT') throw err;
			await this.parentDir().mkdirp(mode);
			await this.mkdirIfNonexistent(mode);
		}
	}
	/**
	 * Creates the directory (and any parent directories if necessary).
	 * Does not throw if the directory already exists. Synchronous.
	 * @param {string | number} mode
	 */
	mkdirpSync(mode = 0o755) {
		try {
			this.mkdirIfNonexistentSync(mode);
		} catch (err) {
			if (err.code !== 'ENOENT') throw err;
			this.parentDir().mkdirpSync(mode);
			this.mkdirIfNonexistentSync(mode);
		}
	}
	/**
	 * Calls the callback if the file is modified.
	 * @param {function (): void} callback
	 */
	onModify(callback) {
		fs.watchFile(this.path, (curr, prev) => {
			if (curr.mtime > prev.mtime) return callback();
		});
	}
	/**
	 * Clears callbacks added with onModify()
	 */
	unwatch() {
		fs.unwatchFile(this.path);
	}
}
/**
 * @param {string} path
 */
function getFs(path) {
	return new FSPath(path);
}

module.exports = Object.assign(getFs, {
	/**
	 * @type {Map<string, [Promise, (() => string | Buffer)?, Object]>}
	 */
	pendingUpdates: new Map(),
});