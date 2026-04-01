import {
  GABRIEL_SUBTITLE_TONE,
  SUBTITLE_CHAR_DELAY_FALLBACK,
  SUBTITLE_CHAR_DELAY_MAX,
  SUBTITLE_CHAR_DELAY_MIN,
  SUBTITLE_HISTORY_RESET_THRESHOLD,
} from './constants';
import {
  clearSubtitleContent,
  setSubtitlePosition,
  setSubtitleTone,
  setSubtitleVisibility,
} from './dom';
import { clearNamedTimer, setNamedInterval } from './timers';
import type {
  DebugClock,
  DialogueCue,
  IntroElements,
  IntroSubtitleController,
  IntroTimerRegistry,
  TypedSubtitleOptions,
} from './types';

interface CreateSubtitleControllerOptions {
  clock: DebugClock;
  elements: IntroElements;
  root: HTMLElement;
  timers: IntroTimerRegistry;
}

export function createSubtitleController({
  clock,
  elements,
  root,
  timers,
}: CreateSubtitleControllerOptions): IntroSubtitleController {
  let activeSubtitleKey = '';
  let activeSubtitleText = '';
  let activeSubtitleResetPoints: number[] = [];
  let subtitleSyncFrame = 0;

  const clearSubtitleTyping = () => {
    clearNamedTimer(clock, timers, 'subtitleTyping');
  };

  const getSubtitleResetPoints = (text: string) => {
    const resetPoints = [0];
    let chunkStart = 0;

    for (let index = 0; index < text.length; index += 1) {
      const character = text.charAt(index);

      if (character !== '.' && character !== '!' && character !== '?') {
        continue;
      }

      const boundaryEnd = index + 1;

      if (boundaryEnd - chunkStart < SUBTITLE_HISTORY_RESET_THRESHOLD) {
        continue;
      }

      let nextChunkStart = boundaryEnd;

      while (
        nextChunkStart < text.length &&
        /\s/.test(text.charAt(nextChunkStart))
      ) {
        nextChunkStart += 1;
      }

      if (nextChunkStart >= text.length) {
        continue;
      }

      resetPoints.push(nextChunkStart);
      chunkStart = nextChunkStart;
    }

    return resetPoints;
  };

  const getVisibleSubtitleText = (visibleLength: number) => {
    if (!activeSubtitleText || visibleLength <= 0) {
      return '';
    }

    const safeLength = Math.max(
      0,
      Math.min(visibleLength, activeSubtitleText.length),
    );
    let chunkStart = 0;

    for (const resetPoint of activeSubtitleResetPoints) {
      if (resetPoint >= safeLength) {
        break;
      }

      chunkStart = resetPoint;
    }

    return activeSubtitleText.slice(chunkStart, safeLength);
  };

  const getSubtitleDuration = (text: string, durationMs?: number) => {
    if (Number.isFinite(durationMs) && (durationMs ?? 0) > 0) {
      return durationMs ?? 0;
    }

    return text.length * SUBTITLE_CHAR_DELAY_FALLBACK;
  };

  const getSubtitleCharDelay = (text: string, durationMs?: number) => {
    const safeTextLength = Math.max(text.length, 1);
    const charDelay = getSubtitleDuration(text, durationMs) / safeTextLength;

    return Math.max(
      SUBTITLE_CHAR_DELAY_MIN,
      Math.min(SUBTITLE_CHAR_DELAY_MAX, charDelay),
    );
  };

  const showTypedSubtitle = ({
    durationMs,
    key,
    position,
    speaker,
    text,
    tone,
  }: TypedSubtitleOptions) => {
    if (activeSubtitleKey === key) {
      return;
    }

    clearSubtitleTyping();
    activeSubtitleKey = key;
    activeSubtitleText = text;
    activeSubtitleResetPoints = getSubtitleResetPoints(text);
    setSubtitleTone(root, tone);
    setSubtitlePosition(root, position);
    elements.subtitleSpeaker.textContent = speaker;
    elements.subtitleText.textContent = '';
    setSubtitleVisibility(root, true);

    if (!text) {
      return;
    }

    let index = 1;
    elements.subtitleText.textContent = getVisibleSubtitleText(index);

    if (index >= text.length) {
      return;
    }

    const charDelay = getSubtitleCharDelay(text, durationMs);

    setNamedInterval(clock, timers, 'subtitleTyping', () => {
      index += 1;
      elements.subtitleText.textContent = getVisibleSubtitleText(index);

      if (index >= text.length) {
        clearSubtitleTyping();
      }
    }, charDelay);
  };

  const clear = () => {
    clearSubtitleTyping();
    activeSubtitleKey = '';
    activeSubtitleText = '';
    activeSubtitleResetPoints = [];
    setSubtitleTone(root, GABRIEL_SUBTITLE_TONE);
    setSubtitleVisibility(root, false);
    clearSubtitleContent(elements.subtitleSpeaker, elements.subtitleText);
  };

  const completeTyping = () => {
    clearSubtitleTyping();

    if (!activeSubtitleText) {
      return;
    }

    elements.subtitleText.textContent = getVisibleSubtitleText(
      activeSubtitleText.length,
    );
  };

  const stopSync = () => {
    if (!subtitleSyncFrame) {
      return;
    }

    window.cancelAnimationFrame(subtitleSyncFrame);
    subtitleSyncFrame = 0;
  };

  const syncDialogue = (
    dialogueAudio: HTMLAudioElement,
    cues: DialogueCue[],
    onCueChange: (cue: DialogueCue | null) => void,
  ) => {
    const updateDialoguePresentation = () => {
      const activeCue =
        cues.find(
          ({ start, end }) =>
            dialogueAudio.currentTime >= start && dialogueAudio.currentTime < end,
        ) ?? null;

      onCueChange(activeCue);

      if (activeCue === null) {
        clear();
        return;
      }

      showTypedSubtitle({
        durationMs: (activeCue.end - activeCue.start) * 1000,
        key: activeCue.id,
        position: activeCue.slide === 'site-two' ? 'top' : 'bottom',
        speaker: activeCue.speaker,
        text: activeCue.text,
        tone: GABRIEL_SUBTITLE_TONE,
      });
    };

    stopSync();

    const syncFrame = () => {
      updateDialoguePresentation();

      if (dialogueAudio.paused || dialogueAudio.ended) {
        subtitleSyncFrame = 0;
        return;
      }

      subtitleSyncFrame = window.requestAnimationFrame(syncFrame);
    };

    syncFrame();
  };

  return {
    clear,
    completeTyping,
    showTypedSubtitle,
    stopSync,
    syncDialogue,
  };
}
