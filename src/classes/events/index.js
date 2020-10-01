// Copyright Node.js contributors. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// This license applies to parts of Node.js originating from the
// https://github.com/joyent/node repository:
//
// Copyright Joyent, Inc. and other Node contributors. All rights reserved.
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.


const getStackEntry = (stack, delta) => {
	if (stack.length < -delta) return null;
	return stack[stack.length + delta];
};

const getStackLeakError = (stack ) => {
	return [
		'(node) warning: possible EventEmitter memory ' +
			'leak detected. Stack is %d units long: %s. ' +
			'Call EventEmitter#[getData|end|flush] exactly once ' +
			'after each EventEmitter#emit call',
		stack.length,
		stack
			.map((entry ) => {
				return entry ? entry._env.eventType : '#null';
			})
			.join(', '),
	];
};
const arrayClone = (arr , i) => {
	const copy = new Array(i);
	while (i--) copy[i] = arr[i];
	return copy;
};
const spliceOne = (list , index) => {
	for (let i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) list[i] = list[k];
	list.pop();
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a letiable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.

function emitNone(handler , isFn , self ) {
	if (isFn) {handler.call(self);} else {
		const len = handler.length;
		const listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self);
	}
}
function emitOne(handler , isFn , self , arg1 ) {
	if (isFn) {handler.call(self, arg1);} else {
		const len = handler.length;
		const listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self, arg1);
	}
}
function emitTwo(handler , isFn , self , arg1 , arg2 ) {
	if (isFn) {handler.call(self, arg1, arg2);} else {
		const len = handler.length;
		const listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2);
	}
}
function emitThree(handler , isFn , self , arg1 , arg2 , arg3 ) {
	if (isFn) {handler.call(self, arg1, arg2, arg3);} else {
		const len = handler.length;
		const listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2, arg3);
	}
}

function emitMany(handler , isFn , self , args ) {
	if (isFn) {handler.apply(self, args);} else {
		const len = handler.length;
		const listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].apply(self, args);
	}
}
class EnvironmentEntry {
    eventType ;
    hadListeners ;
    defaultPrevented ;
    constructor(type ) {
        this.eventType = type;
        this.hadListeners = false;
        this.defaultPrevented = false;
    }
}
class DataEntry {
    constructor(type ) {
        Object.defineProperty(this, '_env', {
            value: new EnvironmentEntry(type),
            enumerable: false,
            writable: false,
            configurable: false,
        });
    }
}
class EventEmitter {
    constructor() {
        this._events = null;
        this._maxListeners = null;
        this.defaultMaxListeners = 10;
        this._eventsCount = 0;
        this._stack = null;
        this._data = null;
        this.parentEvent = '';
        this.event = '';
        this.init();
    }
    /**
     * @private
     */
    init() {
        if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
            this._events = {};
            this._eventsCount = 0;
        }

        this._maxListeners = this._maxListeners || null;
        this._stack = [null];
    }
    _getEvent() {
        const stackEntry = getStackEntry(this._stack, -1);

        if (stackEntry === null) return '';

        return stackEntry._env.eventType;
    }
    /**
     * @private
     */
    _getParentEvent() {
        const stackEntry = getStackEntry(this._stack, -2);

        if (stackEntry === null) return '';

        return stackEntry._env.eventType;
    }
    /**
     * @private
     */
    _popStack() {
        this._stack.pop();
        this._data = getStackEntry(this._stack, -1);
        this.event = this.parentEvent;
        this.parentEvent = this._getParentEvent();
    }
    /**
     * @private
     */
    _pushStack(data ) {
        if (this._stack.push(data) >= 8) {
            // @ts-ignore
            // eslint-disable-next-line prefer-spread
            console.error.apply(console, getStackLeakError(this._stack));
            console.trace();
        }
    }
    getData() {
        if (!this._data) {
           // Missing EventEmitter#emit call
           throw new Error('Bad access to EventEmitter data');
        }
        const data = this._data;
        this._popStack();
        return data;
    }
    flush() {
        if (!this._data) {
            // Missing EventEmitter#emit call
            throw new Error('Bad call to EventEmitter#flush');
        }

        this._popStack();
        return this;
    }
    end(value ) {
        if (!this._data) {
            // Missing EventEmitter#emit call
            throw new Error('Bad call to EventEmitter#end');
        }
        this._popStack();
        return value;
    }
    data(key , value) {
        if (!this._data) {
            // Missing EventEmitter#emit call
            throw new Error('Bad access to EventEmitter#data');
        }

        if (arguments.length < 2) return this._data[key];

        this._data[key] = value;

        return this;
    }
    env(key, value) {
        if (!this._data) {
            // Missing EventEmitter#emit call
            throw new Error('Bad access to EventEmitter environment');
        }
        if (arguments.length < 2) return this._data._env[key];

        this._data._env[key] = value;

        return this;
    }

    preventDefault() {
        this.env('defaultPrevented', true);
        return this;
    }

    isDefaultPrevented() {
        return !!this.env('defaultPrevented');
    }

    hadListeners() {
        return !!this.env('hadListeners');
    }
    setMaxListeners(n) {
        if (typeof n !== 'number' || n < 0 || isNaN(n)) throw new TypeError('n must be a positive number');
        this._maxListeners = n;
        return this;
    }

    getMaxListeners() {
        if (this._maxListeners === undefined) return this.defaultMaxListeners;
        return this._maxListeners;
    }
    /* eslint-disable */
    emit(type, ...params ) ;
    emit(type) {
        if (!type) throw new Error('Unspecified event');
        let er, err , handler, len, args, i;
        let doError = type === 'error';

        this._data = new DataEntry(type);
        this._pushStack(this._data);
        this.event = type;
        this.parentEvent = this._getParentEvent();

        const events = this._events;
        if (events) {
            doError = doError && events.error === null;
            this.env('hadListeners', true);
        } else if (!doError) {return this;}

        // If there is no "error" event listener then throw.
        if (doError) {
            if (!arguments.length) {
                err = new Error(`Uncaught, undefined "error" event.`);
                err.context = undefined;
                throw err;
            } else {
                er = arguments[1];
                if (er instanceof Error) {
                    throw er; // Unhandled "error" event
                } else {
                    // At least give some kind of context to the user
                    err = new Error(`Uncaught, unspecified "error" event. ${' + er + '}`);
                    err.context = er;
                    throw err;
                }
            }
        }

        handler = events[type];

        if (!handler) return this;

        const isFn = typeof handler === 'function';
        len = arguments.length;
        switch (len) {
            // fast cases
            case 1:
                emitNone(handler, isFn, this);
                break;
            case 2:
                emitOne(handler, isFn, this, arguments[1]);
                break;
            case 3:
                emitTwo(handler, isFn, this, arguments[1], arguments[2]);
                break;
            case 4:
                emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
                break;
            // slower
            default:
                args = new Array(len - 1);
                for (i = 1; i < len; i++) args[i - 1] = arguments[i];
                emitMany(handler, isFn, this, args);
        }

        return this;
    }
    /* eslint-enable */
    addListener(type , listener ) {
        let m;
        let events;
        let existing;

        if (typeof listener !== 'function') throw new TypeError('listener must be a function');

        events = this._events;
        if (!events) {
            events = this._events = {};
            this._eventsCount = 0;
        } else {
            // To avoid recursion in the case that type === "newListener"! Before
            // adding it to the listeners, first emit "newListener".
            if (events.newListener) {
                this.emit('newListener', type, listener.listener ? listener.listener : listener);

                // Re-assign `events` because a newListener handler could have caused the
                // this._events to be assigned to a new object
                events = this._events;
            }
            existing = events[type];
        }

        if (!existing) {
            // Optimize the case of one listener. Don"t need the extra array object.
            existing = events[type] = listener;
            ++this._eventsCount;
        } else {
            if (typeof existing === 'function') {
                // Adding the second element, need to change to array.
                existing = events[type] = [existing, listener];
            } else {
                // If we"ve already got an array, just append.
                existing.push(listener);
            }

            // Check for listener leak
            if (!existing.warned) {
                m = this.getMaxListeners();
                if (m && m > 0 && existing.length > m) {
                    existing.warned = true;
                    console.error(
                        '(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d %s listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                        existing.length,
                        type,
                    );
                    console.trace();
                }
            }
        }

        return this;
    }
    on(type , listener ) {
        return this.addListener(type, listener);
    }
    once(type , listener ) {
        if (typeof listener !== 'function') throw new TypeError('listener must be a function');
        let fired = false;
        const g = () => {
            this.removeListener(type, g);
            if (!fired) {
                fired = true;
                // eslint-disable-next-line prefer-rest-params
                listener.apply(this, arguments);
            }
        };
        g.listener = listener;
        this.on(type, g);
        return this;
    }
    removeListener(type , listener ) {
        let position, i;

        if (typeof listener !== 'function') throw new TypeError('listener must be a function');

        const events = this._events;
        if (!events) return this;

        const list = events[type];
        if (!list) return this;

        if (list === listener || (list.listener && list.listener === listener)) {
            if (--this._eventsCount === 0) {this._events = {};} else {
                delete events[type];
                if (events.removeListener) this.emit('removeListener', type, listener);
            }
        } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length; i-- > 0;) {
                if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0) return this;

            if (list.length === 1) {
                list[0] = undefined;
                if (--this._eventsCount === 0) {
                    this._events = {};
                    return this;
                } else {
                    delete events[type];
                }
            } else {
                spliceOne(list, position);
            }
            if (events.removeListener) this.emit('removeListener', type, listener);
        }

        return this;
    }
    off(type , listener ) {
        return this.removeListener(type, listener);
    }
    removeAllListeners(type ) {
        const events = this._events;
        if (!events) return this;

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
            if (arguments.length === 0) {
                this._events = {};
                this._eventsCount = 0;
            } else if (events[type]) {
                if (--this._eventsCount === 0) this._events = {};
                else delete events[type];
            }
            return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
            const keys = Object.keys(events);
            for (let i = 0, key; i < keys.length; ++i) {
                key = keys[i];
                if (key === 'removeListener') continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = {};
            this._eventsCount = 0;
            return this;
        }

        const listeners = events[type];

        if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
        } else if (listeners) {
            // LIFO order
            do {
                this.removeListener(type, listeners[listeners.length - 1]);
            } while (listeners[0]);
        }

        return this;
    }
    listeners(type) {
        let evlistener;
        let ret;
        const events = this._events;

        if (!events) {ret = [];} else {
            evlistener = events[type];
            if (!evlistener) ret = [];
            else if (typeof evlistener === 'function') ret = [evlistener];
            else ret = arrayClone(evlistener, evlistener.length);
        }

        return ret;
    }
    listenerCount(type) {
        const events = this._events;

        if (events) {
            const evlistener = events[type];

            if (typeof evlistener === 'function') {
                return 1;
            } else if (evlistener) {
                return evlistener.length;
            }
        }

        return 0;
    }
}

module.exports = EventEmitter;