import type {
  IntroElements,
  IntroState,
  PhonePhase,
  SceneSlide,
  SubtitlePosition,
  SubtitleTone,
} from './types';

const INTRO_STATES: IntroState[] = [
  'click-me',
  'preloading',
  'typewriter',
  'site-one-transition',
  'site-one',
  'phone-transition',
  'phone',
  'temporary-transition',
  'temporary',
];

const PHONE_PHASES: PhonePhase[] = ['idle', 'ringing', 'answered'];

export function getIntroElements(root: HTMLElement): IntroElements | null {
  const trigger = root.querySelector('[data-intro-trigger]');
  const loadingStatus = root.querySelector('[data-intro-loading-status]');
  const phoneTrigger = root.querySelector('[data-phone-trigger]');
  const typedText = root.querySelector('[data-intro-text]');
  const subtitleBox = root.querySelector('[data-subtitle-box]');
  const subtitleSpeaker = root.querySelector('[data-subtitle-speaker]');
  const subtitleText = root.querySelector('[data-subtitle-text]');
  const phoneOptionsBox = root.querySelector('[data-phone-options-box]');
  const leyaOptionButton = root.querySelector('[data-phone-option="leya-fiore"]');

  if (
    !(trigger instanceof HTMLButtonElement) ||
    !(loadingStatus instanceof HTMLElement) ||
    !(phoneTrigger instanceof HTMLButtonElement) ||
    !(typedText instanceof HTMLElement) ||
    !(subtitleBox instanceof HTMLElement) ||
    !(subtitleSpeaker instanceof HTMLElement) ||
    !(subtitleText instanceof HTMLElement) ||
    !(phoneOptionsBox instanceof HTMLElement) ||
    !(leyaOptionButton instanceof HTMLButtonElement)
  ) {
    return null;
  }

  return {
    root,
    trigger,
    loadingStatus,
    phoneTrigger,
    typedText,
    subtitleBox,
    subtitleSpeaker,
    subtitleText,
    phoneOptionsBox,
    leyaOptionButton,
  };
}

export function setIntroState(root: HTMLElement, state: IntroState): void {
  root.dataset.introState = state;
}

export function getIntroState(root: HTMLElement): IntroState | null {
  const { introState } = root.dataset;

  return INTRO_STATES.includes(introState as IntroState)
    ? (introState as IntroState)
    : null;
}

export function setSceneSlide(root: HTMLElement, slide: SceneSlide): void {
  root.dataset.sceneSlide = slide;
}

export function setPhonePhase(
  root: HTMLElement,
  phase: PhonePhase,
  phoneTrigger: HTMLButtonElement,
): void {
  root.dataset.phonePhase = phase;
  phoneTrigger.disabled = phase !== 'idle';
}

export function getPhonePhase(root: HTMLElement): PhonePhase | null {
  const { phonePhase } = root.dataset;

  return PHONE_PHASES.includes(phonePhase as PhonePhase)
    ? (phonePhase as PhonePhase)
    : null;
}

export function setSubtitleVisibility(root: HTMLElement, isVisible: boolean): void {
  root.dataset.subtitleVisible = isVisible ? 'true' : 'false';
}

export function setSubtitlePosition(
  root: HTMLElement,
  position: SubtitlePosition,
): void {
  root.dataset.subtitlePosition = position;
}

export function setPhoneOptionsVisibility(
  root: HTMLElement,
  isVisible: boolean,
): void {
  root.dataset.phoneOptionsVisible = isVisible ? 'true' : 'false';
}

export function isPhoneOptionsVisible(root: HTMLElement): boolean {
  return root.dataset.phoneOptionsVisible === 'true';
}

export function setBlackoutVisibility(
  root: HTMLElement,
  isVisible: boolean,
): void {
  root.dataset.blackoutVisible = isVisible ? 'true' : 'false';
}

export function setSubtitleTone(root: HTMLElement, tone: SubtitleTone): void {
  root.dataset.subtitleTone = tone;
}

export function setWitnessFlickerActive(
  root: HTMLElement,
  isActive: boolean,
): void {
  root.dataset.witnessFlicker = isActive ? 'true' : 'false';
}

export function isIntroBound(root: HTMLElement): boolean {
  return root.dataset.bound === 'true';
}

export function setIntroBound(root: HTMLElement): void {
  root.dataset.bound = 'true';
}

export function clearSubtitleContent(
  speakerEl: HTMLElement,
  textEl: HTMLElement,
): void {
  speakerEl.textContent = '';
  textEl.textContent = '';
}
