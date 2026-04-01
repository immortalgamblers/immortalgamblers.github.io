import {
  createAmbientTrack,
  createAudioRuntime,
  createEffectAudio,
  createTypeSoundState,
  fadeTrackVolume,
  setTrackLowpassFrequency,
  startAmbientTrack,
  stopAmbientTrack,
  stopPhoneAudio,
} from './audioCore';
import type {
  DebugClock,
  IntroAudioSession,
  IntroBootstrapConfig,
  LoadedGabrielPhoneResponse,
} from './types';

interface CreateIntroAudioSessionOptions {
  clock: DebugClock;
  config: IntroBootstrapConfig;
  isAudioUnlocked: () => boolean;
}

export function createIntroAudioSession({
  clock,
  config,
  isAudioUnlocked,
}: CreateIntroAudioSessionOptions): IntroAudioSession {
  const audioRuntime = createAudioRuntime();
  const typeSoundState = createTypeSoundState(
    config.audio.typeSounds,
    config.runtime.audio.typeSoundPoolSize,
    config.runtime.audio.typeSoundVolume,
  );
  const sceneMusic = createAmbientTrack(config.audio.sceneMusic);
  const barAmbience = createAmbientTrack(config.audio.barAmbience);
  const lampAmbience = createAmbientTrack(config.audio.lampAmbience);
  const phoneRing = createEffectAudio(
    config.audio.phoneRing,
    config.runtime.audio.phoneRingVolume,
  );
  const pietraPhonePickup = createEffectAudio(
    config.audio.pietraPhonePickup,
    config.runtime.audio.phoneAnswerVolume,
  );
  const gabrielPhonePickup = createEffectAudio(
    config.audio.gabrielPhonePickup,
    config.runtime.audio.phoneAnswerVolume,
  );
  const gabrielDialogue = createEffectAudio(
    config.audio.gabrielDialogue,
    config.runtime.audio.gabrielDialogueVolume,
  );
  const gabrielOnPhone = createEffectAudio(
    config.audio.gabrielOnPhone,
    config.runtime.audio.phoneAnswerVolume,
  );
  const leyaWitnessDialogue = createEffectAudio(
    config.audio.leyaWitnessDialogue,
    config.runtime.audio.witnessDialogueVolume,
  );
  const gabrielPhoneResponses: LoadedGabrielPhoneResponse[] =
    config.audio.gabrielPhoneResponses.map((response) => ({
      audio: createEffectAudio(
        response.source,
        config.runtime.audio.phoneAnswerVolume,
      ),
      text: response.text,
    }));
  const debugAudioElements: HTMLAudioElement[] = [
    sceneMusic.audio,
    barAmbience.audio,
    lampAmbience.audio,
    pietraPhonePickup,
    phoneRing,
    gabrielPhonePickup,
    gabrielDialogue,
    gabrielOnPhone,
    leyaWitnessDialogue,
  ];
  let witnessLampActive = false;

  for (const pool of typeSoundState.pools) {
    debugAudioElements.push(...pool);
  }

  for (const response of gabrielPhoneResponses) {
    debugAudioElements.push(response.audio);
  }

  const getScaledDuration = (duration: number) => duration / clock.getSpeed();
  const getMixDuration = () =>
    getScaledDuration(config.runtime.timings.ambienceFadeOutDuration);

  const resetEffectAudio = (audio: HTMLAudioElement) => {
    audio.pause();
    audio.currentTime = 0;
    audio.onended = null;
  };

  return {
    barAmbience,
    gabrielDialogue,
    gabrielOnPhone,
    gabrielPhonePickup,
    gabrielPhoneResponses,
    lampAmbience,
    leyaWitnessDialogue,
    phoneRing,
    pietraPhonePickup,
    resetEffectAudio,
    sceneMusic,
    typeSoundState,
    applyPhoneMix() {
      if (!isAudioUnlocked()) {
        return;
      }

      const mixDuration = getMixDuration();

      fadeTrackVolume(
        sceneMusic,
        config.runtime.audio.phoneMusicTargetVolume,
        mixDuration,
        audioRuntime,
      );
      setTrackLowpassFrequency(
        sceneMusic,
        config.runtime.audio.phoneMusicLowpassFrequency,
        mixDuration,
        audioRuntime,
      );
      fadeTrackVolume(barAmbience, 0, mixDuration, audioRuntime);
    },
    applyWitnessMix() {
      if (!isAudioUnlocked()) {
        return;
      }

      const mixDuration = getMixDuration();

      fadeTrackVolume(
        sceneMusic,
        config.runtime.audio.witnessMusicTargetVolume,
        mixDuration,
        audioRuntime,
      );
      setTrackLowpassFrequency(
        sceneMusic,
        config.runtime.audio.clearMusicLowpassFrequency,
        mixDuration,
        audioRuntime,
      );
      fadeTrackVolume(barAmbience, 0, mixDuration, audioRuntime);
    },
    cleanup() {
      this.stopPhoneCallAudio();
      this.stopGabrielPhoneResponses();
      this.stopWitnessDialogue();
      this.stopWitnessLampAmbience();
      stopAmbientTrack(sceneMusic, audioRuntime);
      stopAmbientTrack(barAmbience, audioRuntime);
      stopAmbientTrack(lampAmbience, audioRuntime);
      resetEffectAudio(gabrielDialogue);
      witnessLampActive = false;
    },
    fadeInSceneMusic() {
      if (!isAudioUnlocked()) {
        return;
      }

      void startAmbientTrack(sceneMusic, audioRuntime);
      void startAmbientTrack(barAmbience, audioRuntime);
      setTrackLowpassFrequency(
        sceneMusic,
        config.runtime.audio.clearMusicLowpassFrequency,
        0,
        audioRuntime,
      );
      fadeTrackVolume(
        sceneMusic,
        config.runtime.audio.musicTargetVolume,
        getScaledDuration(config.runtime.audio.musicFadeDuration),
        audioRuntime,
      );
      fadeTrackVolume(
        barAmbience,
        config.runtime.audio.barTargetVolume,
        getScaledDuration(config.runtime.audio.barFadeDuration),
        audioRuntime,
      );
    },
    setDebugPlaybackRate(nextSpeed) {
      for (const audio of debugAudioElements) {
        audio.defaultPlaybackRate = nextSpeed;
        audio.playbackRate = nextSpeed;
      }
    },
    startWitnessLampAmbience() {
      if (!isAudioUnlocked() || witnessLampActive) {
        return;
      }

      witnessLampActive = true;
      void startAmbientTrack(lampAmbience, audioRuntime);
      fadeTrackVolume(
        lampAmbience,
        config.runtime.audio.lampAmbientTargetVolume,
        getScaledDuration(config.runtime.audio.lampAmbientFadeDuration),
        audioRuntime,
      );
    },
    stopGabrielPhoneResponses() {
      for (const response of gabrielPhoneResponses) {
        resetEffectAudio(response.audio);
      }
    },
    stopPhoneCallAudio() {
      stopPhoneAudio(
        pietraPhonePickup,
        phoneRing,
        gabrielPhonePickup,
        gabrielOnPhone,
      );
    },
    stopWitnessDialogue() {
      resetEffectAudio(leyaWitnessDialogue);
    },
    stopWitnessLampAmbience() {
      witnessLampActive = false;
      stopAmbientTrack(lampAmbience, audioRuntime);
    },
  };
}
