import type {
  DebugClock,
  IntroTimerKey,
  IntroTimerRegistry,
} from './types';

export function createTimerRegistry(): IntroTimerRegistry {
  return {};
}

export function setNamedTimeout(
  clock: DebugClock,
  timers: IntroTimerRegistry,
  key: IntroTimerKey,
  callback: () => void,
  delay: number,
): number {
  clearNamedTimer(clock, timers, key);

  timers[key] = clock.setTimeout(() => {
    delete timers[key];
    callback();
  }, delay);

  return timers[key]!;
}

export function setNamedInterval(
  clock: DebugClock,
  timers: IntroTimerRegistry,
  key: IntroTimerKey,
  callback: () => void,
  delay: number,
): number {
  clearNamedTimer(clock, timers, key);
  timers[key] = clock.setInterval(callback, delay);
  return timers[key]!;
}

export function clearNamedTimer(
  clock: DebugClock,
  timers: IntroTimerRegistry,
  key: IntroTimerKey,
): void {
  const timerId = timers[key];

  if (!timerId) {
    return;
  }

  clock.clear(timerId);
  delete timers[key];
}

export function clearAllNamedTimers(
  clock: DebugClock,
  timers: IntroTimerRegistry,
): void {
  for (const key of Object.keys(timers) as IntroTimerKey[]) {
    clearNamedTimer(clock, timers, key);
  }
}
