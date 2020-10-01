class BemaMap extends Map {
    toJSON() {
        return Array.from(this);
    }

    get length() {
        return this.size;
    }

    union(data) {
        if (Array.isArray(data)) {
            for (const arg of data) {
                if (!arg.id) continue;
                if (!this.has(arg.id)) this.set(arg.id, arg);
            }
        } else if (typeof data === 'object') {
            for (const i in data) {
                if (!this.has(i)) this.set(i, data[i]);
            }
        } else {
            return new Error('Invalid argument');
        }
    }

    difference(data) {
        if (Array.isArray(data)) {
            for (const arg of data) {
                if (!arg.id) continue;
                if (this.has(arg.id)) {
                    this.delete(arg.id);
                }
            }
        } else if (typeof data === 'object') {
            for (const i in data) {
                if (this.has(i)) {
                    this.delete(i);
                }
            }
        } else {
            return new Error('Invalid argument');
        }
        return this.toJSON();
    }

    difSync(data) {
        this.union(data);
        this.dif(data);
        return this.toJSON();
    }

    merge(data) {
        return this.union(data);
    }

    remove(key) {
        return this.delete(key);
    }

    dif(data) {
        return this.difference(data);
    }
}

module.exports = BemaMap;