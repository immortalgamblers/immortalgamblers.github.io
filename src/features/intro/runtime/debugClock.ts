import type { DebugClock } from './types';

interface ScheduledTask {
  callback: () => void;
  delay: number;
  id: number;
  remaining: number;
  repeat: boolean;
}

export function createDebugClock(): DebugClock {
  const tasks = new Map<number, ScheduledTask>();
  let nextTaskId = 1;
  let speed = 1;
  let frameId = 0;
  let lastTimestamp = 0;

  const advance = (timestamp: number) => {
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
      return;
    }

    const elapsed = (timestamp - lastTimestamp) * speed;
    lastTimestamp = timestamp;

    if (elapsed <= 0) {
      return;
    }

    const dueTaskIds: number[] = [];

    for (const task of tasks.values()) {
      task.remaining -= elapsed;

      if (task.remaining <= 0) {
        dueTaskIds.push(task.id);
      }
    }

    for (const taskId of dueTaskIds) {
      const task = tasks.get(taskId);

      if (!task) {
        continue;
      }

      if (!task.repeat) {
        tasks.delete(taskId);
        task.callback();
        continue;
      }

      while (tasks.has(taskId) && task.remaining <= 0) {
        task.remaining += task.delay;
        task.callback();
      }
    }
  };

  const tick = (timestamp: number) => {
    advance(timestamp);

    if (tasks.size === 0) {
      frameId = 0;
      lastTimestamp = 0;
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  };

  const ensureTicking = () => {
    if (frameId !== 0) {
      return;
    }

    lastTimestamp = performance.now();
    frameId = window.requestAnimationFrame(tick);
  };

  const schedule = (
    callback: () => void,
    delay: number,
    repeat: boolean,
  ) => {
    const normalizedDelay = Math.max(0, delay);
    const taskId = nextTaskId++;

    tasks.set(taskId, {
      callback,
      delay: normalizedDelay,
      id: taskId,
      remaining: normalizedDelay,
      repeat,
    });
    ensureTicking();
    return taskId;
  };

  return {
    clear(taskId) {
      tasks.delete(taskId);
    },
    destroy() {
      tasks.clear();

      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      lastTimestamp = 0;
    },
    getSpeed() {
      return speed;
    },
    setInterval(callback, delay) {
      return schedule(callback, delay, true);
    },
    setSpeed(nextSpeed) {
      const normalizedSpeed = Number.isFinite(nextSpeed) && nextSpeed > 0
        ? nextSpeed
        : 1;

      if (tasks.size > 0) {
        advance(performance.now());
      }

      speed = normalizedSpeed;
    },
    setTimeout(callback, delay) {
      return schedule(callback, delay, false);
    },
  };
}
