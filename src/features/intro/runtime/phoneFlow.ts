import {
  GABRIEL_ON_PHONE_TEXT,
  GABRIEL_SPEAKER,
  GABRIEL_SUBTITLE_TONE,
} from './constants';
import { playMedia } from './audioCore';
import {
  getIntroState,
  getPhonePhase,
  isPhoneOptionsVisible,
  setBlackoutVisibility,
  setPhoneOptionsVisibility,
  setPhonePhase,
} from './dom';
import { setNamedTimeout } from './timers';
import type { IntroFlowContext } from './types';

interface CreateIntroPhoneFlowOptions {
  context: IntroFlowContext;
  onLeyaChosen: () => void;
  resetWitnessState: () => void;
}

export function createPhoneFlow({
  context,
  onLeyaChosen,
  resetWitnessState,
}: CreateIntroPhoneFlowOptions) {
  const { audio, clock, config, elements, root, state, subtitles, timers } = context;

  const hidePhoneOptions = () => {
    setPhoneOptionsVisibility(root, false);
  };

  const showPhoneOptions = () => {
    setPhoneOptionsVisibility(root, true);
    window.requestAnimationFrame(() => {
      elements.leyaOptionButton.focus();
    });
  };

  const startPhoneCall = () => {
    if (
      !state.audioUnlocked ||
      getIntroState(root) !== 'phone' ||
      getPhonePhase(root) !== 'idle'
    ) {
      return;
    }

    hidePhoneOptions();
    setBlackoutVisibility(root, false);
    subtitles.clear();
    audio.stopPhoneCallAudio();
    audio.stopGabrielPhoneResponses();
    resetWitnessState();
    setPhonePhase(root, 'ringing', elements.phoneTrigger);

    const revealPhoneOptions = () => {
      audio.gabrielOnPhone.onended = null;
      subtitles.completeTyping();

      setNamedTimeout(clock, timers, 'phoneOptions', () => {
        showPhoneOptions();
      }, config.runtime.timings.phoneOptionsRevealDelay);
    };

    const startGabrielSpeech = () => {
      setNamedTimeout(clock, timers, 'phoneSequence', () => {
        setPhonePhase(root, 'answered', elements.phoneTrigger);
        subtitles.showTypedSubtitle({
          durationMs: Number.isFinite(audio.gabrielOnPhone.duration)
            ? audio.gabrielOnPhone.duration * 1000
            : undefined,
          key: 'gabriel-on-phone',
          position: 'top-right',
          speaker: GABRIEL_SPEAKER,
          text: GABRIEL_ON_PHONE_TEXT,
          tone: GABRIEL_SUBTITLE_TONE,
        });
        audio.gabrielOnPhone.currentTime = 0;
        audio.gabrielOnPhone.onended = revealPhoneOptions;
        playMedia(audio.gabrielOnPhone, revealPhoneOptions);
      }, config.runtime.timings.phoneAnswerSpeechDelay);
    };

    const startGabrielPickup = () => {
      audio.gabrielPhonePickup.currentTime = 0;
      audio.gabrielPhonePickup.onended = () => {
        audio.gabrielPhonePickup.onended = null;
        startGabrielSpeech();
      };
      playMedia(audio.gabrielPhonePickup, startGabrielSpeech);
    };

    const startRinging = () => {
      audio.phoneRing.currentTime = 0;
      audio.phoneRing.onended = () => {
        audio.phoneRing.onended = null;
        startGabrielPickup();
      };
      playMedia(audio.phoneRing, () => {
        audio.phoneRing.onended = null;
        setPhonePhase(root, 'idle', elements.phoneTrigger);
      });
    };

    const scheduleRingingStart = () => {
      setNamedTimeout(clock, timers, 'phoneSequence', () => {
        startRinging();
      }, config.runtime.timings.phoneRingStartDelay);
    };

    audio.pietraPhonePickup.currentTime = 0;
    audio.pietraPhonePickup.onended = () => {
      audio.pietraPhonePickup.onended = null;
      scheduleRingingStart();
    };
    playMedia(audio.pietraPhonePickup, scheduleRingingStart);
  };

  const chooseLeyaFiore = () => {
    if (
      getIntroState(root) !== 'phone' ||
      !isPhoneOptionsVisible(root)
    ) {
      return;
    }

    hidePhoneOptions();
    audio.stopGabrielPhoneResponses();

    const nextResponse =
      audio.gabrielPhoneResponses[
        Math.floor(Math.random() * audio.gabrielPhoneResponses.length)
      ];

    subtitles.showTypedSubtitle({
      durationMs: Number.isFinite(nextResponse.audio.duration)
        ? nextResponse.audio.duration * 1000
        : undefined,
      key: `gabriel-phone-response-${nextResponse.text}`,
      position: 'top-right',
      speaker: GABRIEL_SPEAKER,
      text: nextResponse.text,
      tone: GABRIEL_SUBTITLE_TONE,
    });
    nextResponse.audio.currentTime = 0;

    const handleResponseFinished = () => {
      nextResponse.audio.onended = null;
      subtitles.completeTyping();
      onLeyaChosen();
    };

    nextResponse.audio.onended = handleResponseFinished;
    playMedia(nextResponse.audio, handleResponseFinished);
  };

  return {
    chooseLeyaFiore,
    hidePhoneOptions,
    startPhoneCall,
  };
}
