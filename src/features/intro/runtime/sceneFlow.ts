import {
  clearNamedTimer,
  clearAllNamedTimers,
  setNamedInterval,
  setNamedTimeout,
} from './timers';
import { playMedia, playTypingSound } from './audioCore';
import {
  setBlackoutVisibility,
  setIntroState,
  setPhoneOptionsVisibility,
  setPhonePhase,
  setSceneSlide,
} from './dom';
import type { IntroFlowContext } from './types';

interface CreateIntroSceneFlowOptions {
  context: IntroFlowContext;
  resetWitnessState: () => void;
}

export function createSceneFlow({
  context,
  resetWitnessState,
}: CreateIntroSceneFlowOptions) {
  const { audio, clock, config, elements, root, state, subtitles, timers } = context;

  const revealText = (length: number) => {
    elements.typedText.textContent = config.runtime.titleText.slice(0, length);
    playTypingSound(
      config.runtime.titleText.charAt(length - 1),
      state.audioUnlocked,
      audio.typeSoundState,
    );
  };

  const startPhoneStateTransition = () => {
    subtitles.stopSync();
    setPhoneOptionsVisibility(root, false);
    setBlackoutVisibility(root, false);
    subtitles.clear();
    audio.stopPhoneCallAudio();
    audio.stopGabrielPhoneResponses();
    resetWitnessState();
    setPhonePhase(root, 'idle', elements.phoneTrigger);
    setIntroState(root, 'phone-transition');
    audio.applyPhoneMix();

    setNamedTimeout(clock, timers, 'phoneState', () => {
      subtitles.clear();
      setIntroState(root, 'phone');
    }, config.runtime.timings.phoneTransitionDuration);
  };

  const playGabrielDialogue = () => {
    setSceneSlide(root, 'site-one');
    subtitles.clear();
    subtitles.stopSync();
    audio.gabrielDialogue.currentTime = 0;
    playMedia(audio.gabrielDialogue, startPhoneStateTransition);
    subtitles.syncDialogue(audio.gabrielDialogue, config.dialogueCues, (cue) => {
      if (cue !== null) {
        setSceneSlide(root, cue.slide);
      }
    });
  };

  const startSceneOneTransition = () => {
    setIntroState(root, 'site-one-transition');
    setSceneSlide(root, 'site-one');
    audio.fadeInSceneMusic();

    setNamedTimeout(clock, timers, 'dialogueStart', () => {
      playGabrielDialogue();
    }, config.dialogueStartDelayMs);

    setNamedTimeout(clock, timers, 'transition', () => {
      setIntroState(root, 'site-one');
    }, config.runtime.timings.sceneTransitionCleanupDelay);
  };

  const queueSceneOneTransition = () => {
    setNamedTimeout(clock, timers, 'return', () => {
      startSceneOneTransition();
    }, config.runtime.timings.holdDelay);
  };

  const startTypewriter = () => {
    clearAllNamedTimers(clock, timers);
    setPhoneOptionsVisibility(root, false);
    setBlackoutVisibility(root, false);
    resetWitnessState();
    elements.typedText.textContent = '';
    setIntroState(root, 'typewriter');

    setNamedTimeout(clock, timers, 'typeStart', () => {
      let index = 1;
      revealText(index);

      if (config.runtime.titleText.length === 1) {
        queueSceneOneTransition();
        return;
      }

      setNamedInterval(clock, timers, 'typing', () => {
        index += 1;
        revealText(index);

        if (index < config.runtime.titleText.length) {
          return;
        }

        clearNamedTimer(clock, timers, 'typing');
        queueSceneOneTransition();
      }, config.runtime.timings.typeSpeed);
    }, config.runtime.timings.typeStartDelay);
  };

  const unlockAudioIfNeeded = () => {
    if (state.audioUnlocked) {
      return;
    }

    state.audioUnlocked = true;
    document.documentElement.dataset.audioUnlocked = 'true';
    window.dispatchEvent(
      new CustomEvent('durktown:audio-unlocked', {
        detail: { source: 'intro-click-me' },
      }),
    );
  };

  return {
    startPhoneStateTransition,
    startTypewriter,
    unlockAudioIfNeeded,
  };
}
