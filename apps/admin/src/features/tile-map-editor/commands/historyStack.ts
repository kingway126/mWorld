export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistoryStack<T>(present: T): HistoryStack<T> {
  return {
    past: [],
    present,
    future: [],
  };
}

export function pushHistory<T>(
  history: HistoryStack<T>,
  nextPresent: T,
): HistoryStack<T> {
  if (Object.is(history.present, nextPresent)) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: nextPresent,
    future: [],
  };
}

export function undoHistory<T>(history: HistoryStack<T>): HistoryStack<T> {
  const previous = history.past.at(-1);
  if (!previous) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: HistoryStack<T>): HistoryStack<T> {
  const next = history.future[0];
  if (!next) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
