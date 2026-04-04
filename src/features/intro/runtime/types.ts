import type { GabrielDialogueCue } from '../config/dialogue';

export type IntroState =
  | 'click-me'
  | 'preloading'
  | 'typewriter'
  | 'site-one-transition'
  | 'site-one'
  | 'phone-transition'
  | 'phone'
  | 'temporary-transition'
  | 'temporary';

export type SceneSlide = 'site-one' | 'site-two';

export type PhonePhase = 'idle' | 'ringing' | 'answered';
export type IntroPreloadPhase = 'idle' | 'running' | 'complete';

export type SubtitlePosition = 'top' | 'bottom' | 'top-right';
export type SubtitleTone = 'gabriel' | 'leya';

export type DialogueCue = GabrielDialogueCue;
export type IntroTimerKey =
  | 'typeStart'
  | 'typing'
  | 'return'
  | 'transition'
  | 'dialogueStart'
  | 'phoneState'
  | 'phoneSequence'
  | 'phoneOptions'
  | 'witnessTransition'
  | 'witnessDialogue'
  | 'witnessFlicker'
  | 'subtitleTyping';
export type IntroTimerRegistry = Partial<Record<IntroTimerKey, number>>;

export interface GabrielPhoneResponse {
  source: string;
  text: string;
}

export interface RuntimeConfig {
  titleText: string;
  timings: {
    typeStartDelay: number;
    typeSpeed: number;
    holdDelay: number;
    sceneTransitionCleanupDelay: number;
    phoneTransitionDuration: number;
    ambienceFadeOutDuration: number;
    phoneRingStartDelay: number;
    phoneAnswerSpeechDelay: number;
    phoneOptionsRevealDelay: number;
    witnessTransitionLeadDelay: number;
    witnessBlackoutDuration: number;
    witnessBlackHoldDelay: number;
    witnessDialogueStartDelay: number;
  };
  audio: {
    typeSoundPoolSize: number;
    typeSoundVolume: number;
    musicTargetVolume: number;
    phoneMusicTargetVolume: number;
    witnessMusicTargetVolume: number;
    barTargetVolume: number;
    lampAmbientTargetVolume: number;
    clearMusicLowpassFrequency: number;
    phoneMusicLowpassFrequency: number;
    musicFadeDuration: number;
    barFadeDuration: number;
    lampAmbientFadeDuration: number;
    phoneRingVolume: number;
    phoneAnswerVolume: number;
    gabrielDialogueVolume: number;
    witnessDialogueVolume: number;
  };
}

export interface IntroAudioSources {
  typeSounds: string[];
  sceneMusic: string;
  barAmbience: string;
  lampAmbience: string;
  pietraPhonePickup: string;
  phoneRing: string;
  gabrielPhonePickup: string;
  gabrielDialogue: string;
  gabrielOnPhone: string;
  gabrielPhoneResponses: GabrielPhoneResponse[];
  leyaWitnessDialogue: string;
}

export interface IntroBootstrapConfig {
  audio: IntroAudioSources;
  runtime: RuntimeConfig;
  dialogueStartDelayMs: number;
  dialogueCues: DialogueCue[];
}

export interface IntroElements {
  root: HTMLElement;
  trigger: HTMLButtonElement;
  loadingStatus: HTMLElement;
  phoneTrigger: HTMLButtonElement;
  typedText: HTMLElement;
  subtitleBox: HTMLElement;
  subtitleSpeaker: HTMLElement;
  subtitleText: HTMLElement;
  phoneOptionsBox: HTMLElement;
  leyaOptionButton: HTMLButtonElement;
}

export interface AmbientTrack {
  audio: HTMLAudioElement;
  filterNode: BiquadFilterNode | null;
  gainNode: GainNode | null;
  sourceNode: MediaElementAudioSourceNode | null;
  fadeFrame: number;
}

export interface AudioRuntime {
  audioContext: AudioContext | null;
  AudioContextConstructor: typeof AudioContext | null;
}

export interface TypeSoundState {
  pools: HTMLAudioElement[][];
  indices: number[];
}

export interface DebugClock {
  clear(taskId: number): void;
  destroy(): void;
  getSpeed(): number;
  setInterval(callback: () => void, delay: number): number;
  setSpeed(nextSpeed: number): void;
  setTimeout(callback: () => void, delay: number): number;
}

export interface LoadedGabrielPhoneResponse {
  audio: HTMLAudioElement;
  text: string;
}

export interface IntroAudioSession {
  barAmbience: AmbientTrack;
  gabrielDialogue: HTMLAudioElement;
  gabrielOnPhone: HTMLAudioElement;
  gabrielPhonePickup: HTMLAudioElement;
  gabrielPhoneResponses: LoadedGabrielPhoneResponse[];
  lampAmbience: AmbientTrack;
  leyaWitnessDialogue: HTMLAudioElement;
  phoneRing: HTMLAudioElement;
  pietraPhonePickup: HTMLAudioElement;
  sceneMusic: AmbientTrack;
  typeSoundState: TypeSoundState;
  applyPhoneMix(): void;
  applyWitnessMix(): void;
  cleanup(): void;
  fadeInSceneMusic(): void;
  getPreloadAudioElements(): HTMLAudioElement[];
  resetEffectAudio(audio: HTMLAudioElement): void;
  setDebugPlaybackRate(nextSpeed: number): void;
  startWitnessLampAmbience(): void;
  stopGabrielPhoneResponses(): void;
  stopPhoneCallAudio(): void;
  stopWitnessDialogue(): void;
  stopWitnessLampAmbience(): void;
}

export interface IntroRuntimeState {
  audioUnlocked: boolean;
  introStarted: boolean;
  preloadPhase: IntroPreloadPhase;
  pressedDebugKeys: Set<string>;
}

export interface TypedSubtitleOptions {
  durationMs?: number;
  key: string;
  position: SubtitlePosition;
  speaker: string;
  text: string;
  tone: SubtitleTone;
}

export interface IntroSubtitleController {
  clear(): void;
  completeTyping(): void;
  showTypedSubtitle(options: TypedSubtitleOptions): void;
  stopSync(): void;
  syncDialogue(
    dialogueAudio: HTMLAudioElement,
    cues: DialogueCue[],
    onCueChange: (cue: DialogueCue | null) => void,
  ): void;
}

export interface IntroFlowContext {
  audio: IntroAudioSession;
  clock: DebugClock;
  config: IntroBootstrapConfig;
  elements: IntroElements;
  root: HTMLElement;
  state: IntroRuntimeState;
  subtitles: IntroSubtitleController;
  timers: IntroTimerRegistry;
}
