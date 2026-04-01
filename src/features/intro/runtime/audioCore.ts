import type {
  AmbientTrack,
  AudioRuntime,
  TypeSoundState,
} from './types';

export function createAudioRuntime(): AudioRuntime {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null;

  return {
    audioContext: null,
    AudioContextConstructor,
  };
}

export function createAmbientTrack(source: string): AmbientTrack {
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.loop = true;
  audio.volume = 0;

  return {
    audio,
    filterNode: null,
    gainNode: null,
    sourceNode: null,
    fadeFrame: 0,
  };
}

export function createEffectAudio(source: string, volume: number): HTMLAudioElement {
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

export function createTypeSoundState(
  sources: string[],
  poolSize: number,
  volume: number,
): TypeSoundState {
  return {
    pools: sources.map((source) =>
      Array.from({ length: poolSize }, () => createEffectAudio(source, volume)),
    ),
    indices: new Array(sources.length).fill(0),
  };
}

export function playMedia(
  audio: HTMLAudioElement,
  onRejected?: () => void,
): void {
  audio.play().catch(() => {
    onRejected?.();
  });
}

function getAudioContext(runtime: AudioRuntime): AudioContext | null {
  if (runtime.AudioContextConstructor === null) {
    return null;
  }

  if (runtime.audioContext === null) {
    runtime.audioContext = new runtime.AudioContextConstructor();
  }

  return runtime.audioContext;
}

function ensureAmbientGraph(track: AmbientTrack, runtime: AudioRuntime): void {
  if (track.filterNode || track.gainNode || track.sourceNode) {
    return;
  }

  const context = getAudioContext(runtime);
  if (context === null) {
    return;
  }

  track.sourceNode = context.createMediaElementSource(track.audio);
  track.filterNode = context.createBiquadFilter();
  track.filterNode.type = 'lowpass';
  track.filterNode.frequency.value = 20000;
  track.filterNode.Q.value = 0.0001;
  track.gainNode = context.createGain();
  track.gainNode.gain.value = 0;
  track.sourceNode.connect(track.filterNode);
  track.filterNode.connect(track.gainNode);
  track.gainNode.connect(context.destination);
}

function getTrackVolume(track: AmbientTrack): number {
  if (track.gainNode) {
    return track.gainNode.gain.value;
  }

  return track.audio.volume;
}

function setTrackVolume(track: AmbientTrack, volume: number): void {
  const nextVolume = Math.max(0, Math.min(volume, 1));

  if (track.gainNode) {
    track.gainNode.gain.value = nextVolume;
    track.audio.volume = 1;
    return;
  }

  track.audio.volume = nextVolume;
}

export function stopTrackFade(track: AmbientTrack, runtime: AudioRuntime): void {
  if (track.fadeFrame) {
    window.cancelAnimationFrame(track.fadeFrame);
    track.fadeFrame = 0;
  }

  if (track.gainNode) {
    const context = getAudioContext(runtime);
    if (context) {
      track.gainNode.gain.cancelScheduledValues(context.currentTime);
    }
  }
}

export function fadeTrackVolume(
  track: AmbientTrack,
  targetVolume: number,
  duration: number,
  runtime: AudioRuntime,
): void {
  const clampedTarget = Math.max(0, Math.min(targetVolume, 1));
  const context = getAudioContext(runtime);

  stopTrackFade(track, runtime);

  if (track.gainNode && context) {
    const currentTime = context.currentTime;
    const currentVolume = track.gainNode.gain.value;

    track.gainNode.gain.setValueAtTime(currentVolume, currentTime);
    track.gainNode.gain.linearRampToValueAtTime(
      clampedTarget,
      currentTime + duration / 1000,
    );
    return;
  }

  const startVolume = getTrackVolume(track);
  const fadeStartedAt = performance.now();

  const stepFade = (timestamp: number) => {
    const progress = Math.min((timestamp - fadeStartedAt) / duration, 1);
    const nextVolume = startVolume + (clampedTarget - startVolume) * progress;

    setTrackVolume(track, nextVolume);

    if (progress < 1) {
      track.fadeFrame = window.requestAnimationFrame(stepFade);
      return;
    }

    track.fadeFrame = 0;
  };

  track.fadeFrame = window.requestAnimationFrame(stepFade);
}

export function setTrackLowpassFrequency(
  track: AmbientTrack,
  targetFrequency: number,
  duration: number,
  runtime: AudioRuntime,
): void {
  ensureAmbientGraph(track, runtime);

  if (!track.filterNode) {
    return;
  }

  const context = getAudioContext(runtime);
  if (!context) {
    return;
  }

  const clampedFrequency = Math.max(80, Math.min(targetFrequency, 22000));
  const currentTime = context.currentTime;
  const frequencyParam = track.filterNode.frequency;

  frequencyParam.cancelScheduledValues(currentTime);

  if (duration <= 0) {
    frequencyParam.setValueAtTime(clampedFrequency, currentTime);
    return;
  }

  frequencyParam.setValueAtTime(frequencyParam.value, currentTime);
  frequencyParam.linearRampToValueAtTime(
    clampedFrequency,
    currentTime + duration / 1000,
  );
}

export async function startAmbientTrack(
  track: AmbientTrack,
  runtime: AudioRuntime,
): Promise<void> {
  const context = getAudioContext(runtime);

  ensureAmbientGraph(track, runtime);

  if (context && context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  track.audio.currentTime = 0;
  setTrackVolume(track, 0);
  playMedia(track.audio);
}

export function stopAmbientTrack(track: AmbientTrack, runtime: AudioRuntime): void {
  stopTrackFade(track, runtime);
  track.audio.pause();
  track.audio.currentTime = 0;
}

export function stopPhoneAudio(
  ...audios: HTMLAudioElement[]
): void {
  for (const audio of audios) {
    audio.pause();
    audio.currentTime = 0;
    audio.onended = null;
  }
}

export function playTypingSound(
  character: string,
  audioUnlocked: boolean,
  typeSoundState: TypeSoundState,
): void {
  if (!audioUnlocked || !character.trim() || typeSoundState.pools.length === 0) {
    return;
  }

  const poolIndex = Math.floor(Math.random() * typeSoundState.pools.length);
  const pool = typeSoundState.pools[poolIndex];
  const audioIndex = typeSoundState.indices[poolIndex];
  const audio = pool[audioIndex];

  typeSoundState.indices[poolIndex] = (audioIndex + 1) % pool.length;
  audio.currentTime = 0;
  playMedia(audio);
}
