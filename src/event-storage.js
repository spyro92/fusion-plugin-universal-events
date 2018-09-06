// @flow
/* global window */

const storageKey = 'fusion-events';

type EventType = {|
  type: mixed,
  payload: mixed,
|};

// localStorage wrappers *exported only for testing*
export const get = () => {
  try {
    const events = JSON.parse(window.localStorage.getItem(storageKey));
    return Array.isArray(events) ? events : [];
  } catch (e) {
    return [];
  }
};

export const clear = () => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch (e) {
    // storage may not be writable, do nothing
  }
};

export const set = (events: EventType[]) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  } catch (e) {
    // storage might be full or not writable, do nothing
  }
};

// public methods
export const getAndClear = () => {
  const events = get();
  clear();
  return events;
};

export const add = (...toBeAdded: EventType[]) => set(get().concat(toBeAdded));

export const addToStart = (...toBeAdded: EventType[]) =>
  set(toBeAdded.concat(get()));
