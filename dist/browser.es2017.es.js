import { createPlugin, createToken } from 'fusion-core';
import { FetchToken } from 'fusion-tokens';

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const globalEventType = '*';
class UniversalEmitter {
  constructor() {
    this.handlers = {};
    this.mappers = {};
  }

  map(...args) {
    const {
      type,
      callback
    } = getArgs(args);
    if (!this.mappers[type]) this.mappers[type] = [];
    this.mappers[type].push(callback);
  }

  on(...args) {
    const {
      type,
      callback
    } = getArgs(args);
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(callback);
  }

  off(...args) {
    const {
      type,
      callback
    } = getArgs(args);
    const index = this.handlers[type].indexOf(callback);
    if (index > -1) this.handlers[type].splice(index, 1);
  }

  mapEvent(type, payload, ctx) {
    const globalMappers = this.mappers[globalEventType] || [];
    const mappers = (this.mappers[type] || []).concat(globalMappers);
    return mappers.reduce((payload, mapper) => {
      return mapper(payload, ctx, type);
    }, payload);
  }

  handleEvent(type, payload, ctx) {
    const globalHandlers = this.handlers[globalEventType] || [];
    const handlers = (this.handlers[type] || []).concat(globalHandlers);
    handlers.forEach(handler => handler(payload, ctx, type));
  }
  /* eslint-disable-next-line  no-unused-vars */


  from(ctx) {
    throw new Error('Not implemented.');
  }
  /* eslint-disable-next-line  no-unused-vars */


  emit(type, payload, ctx) {} // throw new Error('Not implemented.');

  /* eslint-disable-next-line  no-unused-vars */


  setFrequency(frequency) {
    throw new Error('Not implemented.');
  }

  teardown() {
    throw new Error('Not implemented.');
  }

  flush() {
    throw new Error('Not implemented.');
  }

}

function validateHandler(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
}

function getArgs(args) {
  const type = typeof args[0] === 'string' ? args[0] : globalEventType;
  const callback = args[1] || args[0];
  validateHandler(callback);
  return {
    type,
    callback
  };
}

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/* eslint-env node */

/* global window */
const storageKey = 'fusion-events';
// localStorage wrappers *exported only for testing*
const get = () => {
  try {
    const events = JSON.parse(window.localStorage.getItem(storageKey));
    return Array.isArray(events) ? events : [];
  } catch (e) {
    return [];
  }
};
const clear = () => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch (e) {// storage may not be writable, do nothing
  }
};
const set = events => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  } catch (e) {// storage might be full or not writable, do nothing
  }
}; // public methods

const getAndClear = () => {
  const events = get();
  clear();
  return events;
};
const add = (...toBeAdded) => set(get().concat(toBeAdded));
const addToStart = (...toBeAdded) => set(toBeAdded.concat(get()));

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/* eslint-env browser */
class UniversalEmitter$1 extends UniversalEmitter {
  constructor(fetch) {
    super(); //privates

    this.flush = this.flushInternal.bind(this);
    this.fetch = fetch;
    this.setFrequency(5000);
    window.addEventListener('beforeunload', this.flush);
  }

  setFrequency(frequency) {
    window.clearInterval(this.interval);
    this.interval = setInterval(this.flush, frequency);
  }

  emit(type, payload) {
    payload = super.mapEvent(type, payload);
    super.handleEvent(type, payload);
    add({
      type,
      payload
    });
  } // match server api


  from() {
    return this;
  }

  async flushInternal() {
    const items = getAndClear();
    if (items.length === 0) return;

    try {
      const res = await this.fetch('/_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items
        })
      });

      if (!res.ok) {
        // sending failed so put the logs back into storage
        addToStart(...items);
      }
    } catch (e) {
      // sending failed so put the logs back into storage
      addToStart(...items);
    }
  }

  teardown() {
    window.removeEventListener('beforeunload', this.flush);
    clearInterval(this.interval);
    this.interval = null;
  }

}

const plugin$2 = true && createPlugin({
  deps: {
    fetch: FetchToken
  },
  provides: ({
    fetch
  }) => {
    return new UniversalEmitter$1(fetch);
  },
  cleanup: async emitter => {
    return emitter.teardown();
  }
});

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const UniversalEventsPlugin = plugin$2; // eslint-disable-next-line prettier/prettier

const UniversalEventsToken = createToken('UniversalEventsToken');

export default UniversalEventsPlugin;
export { UniversalEventsToken };
//# sourceMappingURL=browser.es2017.es.js.map
