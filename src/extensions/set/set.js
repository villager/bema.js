'use strict';

class BemaSet extends Set {
    toJSON() {
        return Array.from(this);
    }
    get length() {
        return this.size;
    }
    merge(toAssign) {
        if (Array.isArray(toAssign)) {
            for (const task of toAssign) {
                this.add(task);
            }
        } else if (typeof toAssign === 'string') {
            this.add(toAssign);
        } else if (typeof toAssign === 'object') {
            for (const i in toAssign) {
                this.add(i); // Just save keys
            }
        } else {
            this.add(toAssign);
        }        
    }
    remove(key) {
        this.delete(key);
    }
    difference(data) {
        if (Array.isArray(data)) {
            for (const i of data) {
                if (this.has(i)) {
                    this.remove(i);
                }
            }
        } else if (typeof data === 'object') {
            for (const i in data) {
                if (this.has(i)) {
                    this.remove(i);
                }
            }
        } else {
            if (this.has(data)) {
                this.remove(data);
            }
        }
        return this.toJSON();
    }

    intersection(data) {
        const list = this.toJSON();
        if (Array.isArray(data)) {
            data = new UtilSet(data);
            list.filter(x => {
                data.has(x);
            });
        } else if (typeof data === 'object') {
            data = new UtilSet(Object.values(data));
            list.filter(x => {
                data.has(x);
            });
        } else {
            throw Error('Invalid arg');
        }
        return list;
    }
    difSync(data) {
        this.union(data);
        this.dif(data);
        return this.toJSON();
    }

	union(data){
		return this.merge(data);
    }

	dif(data) {
		return this.difference(data);
    }

    inter(data) {
        return this.intersection(data);
    }
}

module.exports = BemaSet;