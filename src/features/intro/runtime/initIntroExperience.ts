import { createIntroAudioSession } from './audioSession';
import {
  DEBUG_SPEED_CODES,
  DEBUG_SPEED_MULTIPLIER,
} from './constants';
import { createDebugClock } from './debugClock';
import {
  getIntroElements,
  isIntroBound,
  setIntroBound,
  setPhonePhase,
  setWitnessFlickerActive,
} from './dom';
import { createPhoneFlow } from './phoneFlow';
import { createSceneFlow } from './sceneFlow';
import { createSubtitleController } from './subtitles';
import { clearAllNamedTimers, createTimerRegistry } from './timers';
import type {
  IntroBootstrapConfig,
  IntroRuntimeState,
} from './types';
import { createWitnessFlow } from './witnessFlow';

export function initIntroExperience(
  root: HTMLElement,
  config: IntroBootstrapConfig,
): void {
  if (!(root instanceof HTMLElement) || isIntroBound(root)) {
    return;
  }

  const elements = getIntroElements(root);

  if (elements === null) {
    return;
  }

  setIntroBound(root);

  const clock = createDebugClock();
  const timers = createTimerRegistry();
  const state: IntroRuntimeState = {
    audioUnlocked: document.documentElement.dataset.audioUnlocked === 'true',
    pressedDebugKeys: new Set<string>(),
  };
  const subtitles = createSubtitleController({
    clock,
    elements,
    root,
    timers,
  });
  const audio = createIntroAudioSession({
    clock,
    config,
    isAudioUnlocked: () => state.audioUnlocked,
  });
  const context = {
    audio,
    clock,
    config,
    elements,
    root,
    state,
    subtitles,
    timers,
  };
  const witnessFlow = createWitnessFlow({ context });
  const phoneFlow = createPhoneFlow({
    context,
    onLeyaChosen: () => {
      witnessFlow.transitionToTemporaryState();
    },
    resetWitnessState: witnessFlow.resetWitnessState,
  });
  const sceneFlow = createSceneFlow({
    context,
    resetWitnessState: witnessFlow.resetWitnessState,
  });

  const setDebugSpeed = (nextSpeed: number) => {
    if (clock.getSpeed() === nextSpeed) {
      return;
    }

    clock.setSpeed(nextSpeed);
    root.style.setProperty('--intro-debug-speed', String(nextSpeed));
    audio.setDebugPlaybackRate(nextSpeed);
  };

  const syncDebugSpeed = () => {
    setDebugSpeed(
      state.pressedDebugKeys.size > 0 ? DEBUG_SPEED_MULTIPLIER : 1,
    );
  };

  const handleDebugKeyDown = (event: KeyboardEvent) => {
    if (!DEBUG_SPEED_CODES.has(event.code)) {
      return;
    }

    state.pressedDebugKeys.add(event.code);
    syncDebugSpeed();
  };

  const handleDebugKeyUp = (event: KeyboardEvent) => {
    if (!DEBUG_SPEED_CODES.has(event.code)) {
      return;
    }

    state.pressedDebugKeys.delete(event.code);
    syncDebugSpeed();
  };

  const resetDebugSpeed = () => {
    if (state.pressedDebugKeys.size === 0 && clock.getSpeed() === 1) {
      return;
    }

    state.pressedDebugKeys.clear();
    syncDebugSpeed();
  };

  const handleGabrielDialogueEnded = () => {
    sceneFlow.startPhoneStateTransition();
  };

  const handleTriggerClick = () => {
    sceneFlow.unlockAudioIfNeeded();
    sceneFlow.startTypewriter();
  };

  const handlePageHide = () => {
    resetDebugSpeed();
    clearAllNamedTimers(clock, timers);
    clock.destroy();
    subtitles.stopSync();
    phoneFlow.hidePhoneOptions();
    witnessFlow.hideBlackout();
    subtitles.clear();
    witnessFlow.resetWitnessState();
    audio.cleanup();
    setPhonePhase(root, 'idle', elements.phoneTrigger);
    setWitnessFlickerActive(root, false);
    audio.gabrielDialogue.removeEventListener('ended', handleGabrielDialogueEnded);
    elements.trigger.removeEventListener('click', handleTriggerClick);
    elements.phoneTrigger.removeEventListener('click', phoneFlow.startPhoneCall);
    elements.leyaOptionButton.removeEventListener('click', phoneFlow.chooseLeyaFiore);
    window.removeEventListener('keydown', handleDebugKeyDown);
    window.removeEventListener('keyup', handleDebugKeyUp);
    window.removeEventListener('blur', resetDebugSpeed);
    window.removeEventListener('pagehide', handlePageHide);
  };

  root.style.setProperty('--intro-debug-speed', '1');
  root.style.setProperty(
    '--intro-blackout-duration',
    `${config.runtime.timings.witnessBlackoutDuration}ms`,
  );
  setWitnessFlickerActive(root, false);
  setPhonePhase(root, 'idle', elements.phoneTrigger);
  phoneFlow.hidePhoneOptions();
  witnessFlow.hideBlackout();
  subtitles.clear();

  audio.gabrielDialogue.addEventListener('ended', handleGabrielDialogueEnded);
  window.addEventListener('keydown', handleDebugKeyDown);
  window.addEventListener('keyup', handleDebugKeyUp);
  window.addEventListener('blur', resetDebugSpeed);
  window.addEventListener('pagehide', handlePageHide);
  elements.trigger.addEventListener('click', handleTriggerClick);
  elements.phoneTrigger.addEventListener('click', phoneFlow.startPhoneCall);
  elements.leyaOptionButton.addEventListener('click', phoneFlow.chooseLeyaFiore);
}
