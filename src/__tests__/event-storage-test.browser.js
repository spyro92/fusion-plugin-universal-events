/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import {get, clear, add, addToStart, getAndClear} from '../event-storage';

test('event-storage clear', async t => {
  clear();
  t.notOk(get().length, 'clear should empty the array');
  t.end();
});

test('event-storage add', async t => {
  const data = {type: 'nick', payload: 'test'};
  clear();
  add(data);
  t.deepEqual(get(), [data], 'add should add to storage');
  t.end();
});

test('event-storage addToStart', async t => {
  const data1 = {type: '1', payload: 'test'};
  const data2 = {type: '2', payload: 'test'};
  clear();
  add(data1);
  addToStart(data2);

  t.deepEqual(
    get(),
    [data2, data1],
    'addToStart should add to beginning of array'
  );
  t.end();
});

test('event-storage getAndClear', async t => {
  const data = {type: 'nick', payload: 'test'};
  clear();
  add(data);

  t.deepEqual(getAndClear(), [data], 'getAndClear should get current array');
  t.notOk(get().length, 'and clear it');
  t.end();
});
