import { memoize, createPlugin, createToken } from 'fusion-core';

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
class GlobalEmitter extends UniversalEmitter {
  constructor() {
    super();
    this.from = memoize(ctx => {
      return new ScopedEmitter(ctx, this);
    });
  }

  emit(type, payload, ctx) {
    payload = super.mapEvent(type, payload, this.ctx);
    super.handleEvent(type, payload, ctx);
  } // mirror browser api


  setFrequency() {}

  teardown() {}

}

class ScopedEmitter extends UniversalEmitter {
  constructor(ctx, parent) {
    super();
    this.ctx = ctx;
    this.parent = parent;
    this.batch = [];
    this.flushed = false;
  }

  emit(type, payload) {
    // this logic exists to manage ensuring we send events after the batch
    if (this.flushed) {
      this.handleBatchedEvent({
        type,
        payload
      });
    } else {
      this.batch.push({
        type,
        payload
      });
    }
  }

  handleBatchedEvent({
    type,
    payload
  }) {
    payload = super.mapEvent(type, payload, this.ctx);
    payload = this.parent.mapEvent(type, payload, this.ctx);
    super.handleEvent(type, payload, this.ctx);
    this.parent.handleEvent(type, payload, this.ctx);
  }

  flush() {
    for (let index = 0; index < this.batch.length; index++) {
      this.handleBatchedEvent(this.batch[index]);
    }

    this.batch = [];
    this.flushed = true;
  } // mirror browser api


  setFrequency() {}

  teardown() {}

}

const plugin = true && createPlugin({
  provides: () => new GlobalEmitter(),
  middleware: (deps, globalEmitter) => {
    const bodyParser = require('koa-bodyparser');

    const parseBody = bodyParser();
    return async function universalEventsMiddleware(ctx, next) {
      const emitter = globalEmitter.from(ctx);

      if (ctx.method === 'POST' && ctx.path === '/_events') {
        await parseBody(ctx, async () => {}); // $FlowFixMe

        const {
          items
        } = ctx.request.body;

        if (items) {
          for (let index = 0; index < items.length; index++) {
            const {
              type,
              payload
            } = items[index];
            emitter.emit(type, payload);
          }

          ctx.status = 200;
        } else {
          ctx.status = 400;
        }
      } // awaiting next before registering `then` on ctx.timing.end to try and get as much as possible
      // into the event batch flush.


      await next();
      ctx.timing.end.then(() => {
        emitter.flush();
      });
    };
  }
});

/* global window */
// localStorage wrappers *exported only for testing*


 // public methods

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/* eslint-env browser */

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const UniversalEventsPlugin = plugin; // eslint-disable-next-line prettier/prettier

const UniversalEventsToken = createToken('UniversalEventsToken');

export default UniversalEventsPlugin;
export { UniversalEventsToken };
//# sourceMappingURL=index.es.js.map
