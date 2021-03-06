import { memoize, createPlugin, createToken } from 'fusion-core';
import { FetchToken } from 'fusion-tokens';

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
var globalEventType = '*';

var UniversalEmitter =
/*#__PURE__*/
function () {
  function UniversalEmitter() {
    this.handlers = {};
    this.mappers = {};
  }

  var _proto = UniversalEmitter.prototype;

  _proto.map = function map() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _getArgs = getArgs(args),
        type = _getArgs.type,
        callback = _getArgs.callback;

    if (!this.mappers[type]) this.mappers[type] = [];
    this.mappers[type].push(callback);
  };

  _proto.on = function on() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var _getArgs2 = getArgs(args),
        type = _getArgs2.type,
        callback = _getArgs2.callback;

    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(callback);
  };

  _proto.off = function off() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var _getArgs3 = getArgs(args),
        type = _getArgs3.type,
        callback = _getArgs3.callback;

    var index = this.handlers[type].indexOf(callback);
    if (index > -1) this.handlers[type].splice(index, 1);
  };

  _proto.mapEvent = function mapEvent(type, payload, ctx) {
    var globalMappers = this.mappers[globalEventType] || [];
    var mappers = (this.mappers[type] || []).concat(globalMappers);
    return mappers.reduce(function (payload, mapper) {
      return mapper(payload, ctx, type);
    }, payload);
  };

  _proto.handleEvent = function handleEvent(type, payload, ctx) {
    var globalHandlers = this.handlers[globalEventType] || [];
    var handlers = (this.handlers[type] || []).concat(globalHandlers);
    handlers.forEach(function (handler) {
      return handler(payload, ctx, type);
    });
  };
  /* eslint-disable-next-line  no-unused-vars */


  _proto.from = function from(ctx) {
    throw new Error('Not implemented.');
  };
  /* eslint-disable-next-line  no-unused-vars */


  _proto.emit = function emit(type, payload, ctx) {} // throw new Error('Not implemented.');

  /* eslint-disable-next-line  no-unused-vars */
  ;

  _proto.setFrequency = function setFrequency(frequency) {
    throw new Error('Not implemented.');
  };

  _proto.teardown = function teardown() {
    throw new Error('Not implemented.');
  };

  _proto.flush = function flush() {
    throw new Error('Not implemented.');
  };

  return UniversalEmitter;
}();

function validateHandler(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
}

function getArgs(args) {
  var type = typeof args[0] === 'string' ? args[0] : globalEventType;
  var callback = args[1] || args[0];
  validateHandler(callback);
  return {
    type: type,
    callback: callback
  };
}

function _inheritsLoose(subClass, superClass) { subClass.prototype.__proto__ = superClass && superClass.prototype; subClass.__proto__ = superClass; }

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/* eslint-env node */
var GlobalEmitter =
/*#__PURE__*/
function (_Emitter) {
  _inheritsLoose(GlobalEmitter, _Emitter);

  function GlobalEmitter() {
    var _this;

    _this = _Emitter.call(this) || this;
    _this.from = memoize(function (ctx) {
      return new ScopedEmitter(ctx, _this);
    });
    return _this;
  }

  var _proto = GlobalEmitter.prototype;

  _proto.emit = function emit(type, payload, ctx) {
    payload = _Emitter.prototype.mapEvent.call(this, type, payload, this.ctx);

    _Emitter.prototype.handleEvent.call(this, type, payload, ctx);
  }; // mirror browser api


  _proto.setFrequency = function setFrequency() {};

  _proto.teardown = function teardown() {};

  return GlobalEmitter;
}(UniversalEmitter);

var ScopedEmitter =
/*#__PURE__*/
function (_Emitter2) {
  _inheritsLoose(ScopedEmitter, _Emitter2);

  function ScopedEmitter(ctx, parent) {
    var _this2;

    _this2 = _Emitter2.call(this) || this;
    _this2.ctx = ctx;
    _this2.parent = parent;
    _this2.batch = [];
    _this2.flushed = false;
    return _this2;
  }

  var _proto2 = ScopedEmitter.prototype;

  _proto2.emit = function emit(type, payload) {
    // this logic exists to manage ensuring we send events after the batch
    if (this.flushed) {
      this.handleBatchedEvent({
        type: type,
        payload: payload
      });
    } else {
      this.batch.push({
        type: type,
        payload: payload
      });
    }
  };

  _proto2.handleBatchedEvent = function handleBatchedEvent(_ref) {
    var type = _ref.type,
        payload = _ref.payload;
    payload = _Emitter2.prototype.mapEvent.call(this, type, payload, this.ctx);
    payload = this.parent.mapEvent(type, payload, this.ctx);

    _Emitter2.prototype.handleEvent.call(this, type, payload, this.ctx);

    this.parent.handleEvent(type, payload, this.ctx);
  };

  _proto2.flush = function flush() {
    for (var index = 0; index < this.batch.length; index++) {
      this.handleBatchedEvent(this.batch[index]);
    }

    this.batch = [];
    this.flushed = true;
  }; // mirror browser api


  _proto2.setFrequency = function setFrequency() {};

  _proto2.teardown = function teardown() {};

  return ScopedEmitter;
}(UniversalEmitter);

/* global window */
var storageKey = 'fusion-events';
// localStorage wrappers *exported only for testing*
var get = function get() {
  try {
    var events = JSON.parse(window.localStorage.getItem(storageKey));
    return Array.isArray(events) ? events : [];
  } catch (e) {
    return [];
  }
};
var clear = function clear() {
  try {
    window.localStorage.removeItem(storageKey);
  } catch (e) {// storage may not be writable, do nothing
  }
};
var set = function set(events) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  } catch (e) {// storage might be full or not writable, do nothing
  }
}; // public methods

var getAndClear = function getAndClear() {
  var events = get();
  clear();
  return events;
};
var add = function add() {
  for (var _len = arguments.length, toBeAdded = new Array(_len), _key = 0; _key < _len; _key++) {
    toBeAdded[_key] = arguments[_key];
  }

  return set(get().concat(toBeAdded));
};
var addToStart = function addToStart() {
  for (var _len2 = arguments.length, toBeAdded = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    toBeAdded[_key2] = arguments[_key2];
  }

  return set(toBeAdded.concat(get()));
};

function _inheritsLoose$1(subClass, superClass) { subClass.prototype.__proto__ = superClass && superClass.prototype; subClass.__proto__ = superClass; }

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/* eslint-env browser */
var UniversalEmitter$1 =
/*#__PURE__*/
function (_Emitter) {
  _inheritsLoose$1(UniversalEmitter$$1, _Emitter);

  function UniversalEmitter$$1(fetch) {
    var _this;

    _this = _Emitter.call(this) || this; //privates

    _this.flush = _this.flushInternal.bind(_this);
    _this.fetch = fetch;

    _this.setFrequency(5000);

    window.addEventListener('beforeunload', _this.flush);
    return _this;
  }

  var _proto = UniversalEmitter$$1.prototype;

  _proto.setFrequency = function setFrequency(frequency) {
    window.clearInterval(this.interval);
    this.interval = setInterval(this.flush, frequency);
  };

  _proto.emit = function emit(type, payload) {
    payload = _Emitter.prototype.mapEvent.call(this, type, payload);

    _Emitter.prototype.handleEvent.call(this, type, payload);

    add({
      type: type,
      payload: payload
    });
  }; // match server api


  _proto.from = function from() {
    return this;
  };

  _proto.flushInternal = function flushInternal() {
    return new Promise(function ($return, $error) {
      var items, res;
      items = getAndClear();
      if (items.length === 0) return $return();

      var $Try_1_Post = function () {
        try {
          return $return();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      };

      var $Try_1_Catch = function (e) {
        try {
          // sending failed so put the logs back into storage
          addToStart.apply(void 0, items);
          return $Try_1_Post();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      };

      try {
        return Promise.resolve(this.fetch('/_events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: items
          })
        })).then(function ($await_2) {
          try {
            res = $await_2;

            if (!res.ok) {
              // sending failed so put the logs back into storage
              addToStart.apply(void 0, items);
            }

            return $Try_1_Post();
          } catch ($boundEx) {
            return $Try_1_Catch($boundEx);
          }
        }, $Try_1_Catch);
      } catch (e) {
        $Try_1_Catch(e);
      }
    }.bind(this));
  };

  _proto.teardown = function teardown() {
    window.removeEventListener('beforeunload', this.flush);
    clearInterval(this.interval);
    this.interval = null;
  };

  return UniversalEmitter$$1;
}(UniversalEmitter);

var plugin$2 = true && createPlugin({
  deps: {
    fetch: FetchToken
  },
  provides: function provides(_ref) {
    var fetch = _ref.fetch;
    return new UniversalEmitter$1(fetch);
  },
  cleanup: function cleanup(emitter) {
    return new Promise(function ($return, $error) {
      return $return(emitter.teardown());
    });
  }
});

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
var UniversalEventsPlugin = plugin$2; // eslint-disable-next-line prettier/prettier

var UniversalEventsToken = createToken('UniversalEventsToken');

export default UniversalEventsPlugin;
export { UniversalEventsToken };
//# sourceMappingURL=browser.es5.es.js.map
