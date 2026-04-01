import {
  LEYA_SPEAKER,
  LEYA_SUBTITLE_TONE,
  LEYA_WITNESS_TEXT,
} from './constants';
import { playMedia } from './audioCore';
import {
  getIntroState,
  setBlackoutVisibility,
  setIntroState,
  setPhoneOptionsVisibility,
  setPhonePhase,
  setWitnessFlickerActive,
} from './dom';
import { clearNamedTimer, setNamedTimeout } from './timers';
import type { IntroFlowContext } from './types';

interface CreateIntroWitnessFlowOptions {
  context: IntroFlowContext;
}

export function createWitnessFlow({
  context,
}: CreateIntroWitnessFlowOptions) {
  const { audio, clock, config, elements, root, subtitles, timers } = context;

  const getRandomDelay = (min: number, max: number) =>
    Math.round(min + Math.random() * (max - min));

  const hideBlackout = () => {
    setBlackoutVisibility(root, false);
  };

  const showBlackout = () => {
    setBlackoutVisibility(root, true);
  };

  const stopWitnessFlicker = () => {
    clearNamedTimer(clock, timers, 'witnessFlicker');
    setWitnessFlickerActive(root, false);
  };

  const queueWitnessFlicker = () => {
    setNamedTimeout(clock, timers, 'witnessFlicker', () => {
      setWitnessFlickerActive(root, true);

      const finishSequence = () => {
        setWitnessFlickerActive(root, false);

        if (getIntroState(root) === 'temporary') {
          queueWitnessFlicker();
        }
      };

      const maybeRunSecondDropout = () => {
        if (Math.random() >= 0.28) {
          finishSequence();
          return;
        }

        setNamedTimeout(clock, timers, 'witnessFlicker', () => {
          setWitnessFlickerActive(root, true);

          setNamedTimeout(clock, timers, 'witnessFlicker', () => {
            finishSequence();
          }, getRandomDelay(45, 120));
        }, getRandomDelay(35, 85));
      };

      setNamedTimeout(clock, timers, 'witnessFlicker', () => {
        setWitnessFlickerActive(root, false);
        maybeRunSecondDropout();
      }, getRandomDelay(55, 150));
    }, getRandomDelay(2600, 6200));
  };

  const startWitnessFlicker = () => {
    if (timers.witnessFlicker || root.dataset.witnessFlicker === 'true') {
      return;
    }

    queueWitnessFlicker();
  };

  const resetWitnessState = () => {
    clearNamedTimer(clock, timers, 'witnessDialogue');
    clearNamedTimer(clock, timers, 'witnessTransition');
    audio.stopWitnessDialogue();
    audio.stopWitnessLampAmbience();
    stopWitnessFlicker();
  };

  const returnToPhoneState = () => {
    setPhoneOptionsVisibility(root, false);
    audio.stopPhoneCallAudio();
    audio.stopGabrielPhoneResponses();
    resetWitnessState();
    setPhonePhase(root, 'idle', elements.phoneTrigger);
    subtitles.clear();
    showBlackout();

    setNamedTimeout(clock, timers, 'witnessTransition', () => {
      setIntroState(root, 'phone');
      audio.applyPhoneMix();
      hideBlackout();
    }, config.runtime.timings.witnessBlackoutDuration);
  };

  const startWitnessDialogue = () => {
    if (getIntroState(root) !== 'temporary') {
      return;
    }

    setNamedTimeout(clock, timers, 'witnessDialogue', () => {
      if (getIntroState(root) !== 'temporary') {
        return;
      }

      const handleDialogueFinished = () => {
        audio.leyaWitnessDialogue.onended = null;
        subtitles.completeTyping();
        returnToPhoneState();
      };

      subtitles.showTypedSubtitle({
        durationMs: Number.isFinite(audio.leyaWitnessDialogue.duration)
          ? audio.leyaWitnessDialogue.duration * 1000
          : undefined,
        key: 'witness-leya-dialogue',
        position: 'bottom',
        speaker: LEYA_SPEAKER,
        text: LEYA_WITNESS_TEXT,
        tone: LEYA_SUBTITLE_TONE,
      });

      audio.leyaWitnessDialogue.currentTime = 0;
      audio.leyaWitnessDialogue.onended = handleDialogueFinished;
      playMedia(audio.leyaWitnessDialogue, handleDialogueFinished);
    }, config.runtime.timings.witnessDialogueStartDelay);
  };

  const transitionToTemporaryState = () => {
    setPhoneOptionsVisibility(root, false);
    audio.stopPhoneCallAudio();
    audio.stopGabrielPhoneResponses();
    resetWitnessState();

    setNamedTimeout(clock, timers, 'witnessTransition', () => {
      subtitles.clear();
      showBlackout();

      setNamedTimeout(clock, timers, 'witnessTransition', () => {
        setIntroState(root, 'temporary-transition');
        audio.applyWitnessMix();
        audio.startWitnessLampAmbience();

        setNamedTimeout(clock, timers, 'witnessTransition', () => {
          setIntroState(root, 'temporary');
          hideBlackout();
          startWitnessFlicker();
          startWitnessDialogue();
        }, config.runtime.timings.witnessBlackHoldDelay);
      }, config.runtime.timings.witnessBlackoutDuration);
    }, config.runtime.timings.witnessTransitionLeadDelay);
  };

  return {
    hideBlackout,
    resetWitnessState,
    transitionToTemporaryState,
  };
}
