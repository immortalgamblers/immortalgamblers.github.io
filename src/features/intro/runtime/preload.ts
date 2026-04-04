import type { IntroAudioSession } from './types';

const AUDIO_BUFFER_TOLERANCE_SECONDS = 0.25;
const INTRO_PRELOAD_TIMEOUT_MS = 15000;

type PreloadAssetStatus = 'loaded' | 'failed';

interface PreloadAsset {
  url: string;
  start(onSettle: (status: PreloadAssetStatus) => void): () => void;
}

export interface IntroPreloadProgress {
  loadedCount: number;
  totalCount: number;
  failedAssets: string[];
  timedOutAssets: string[];
}

export interface IntroPreloadResult extends IntroPreloadProgress {
  cancelled: boolean;
  timedOut: boolean;
}

export interface IntroPreloadTask {
  cancel(): void;
  done: Promise<IntroPreloadResult>;
  totalCount: number;
}

interface StartIntroPreloadOptions {
  root: HTMLElement;
  audio: IntroAudioSession;
  onProgress?: (progress: IntroPreloadProgress) => void;
  timeoutMs?: number;
}

function getImageUrl(image: HTMLImageElement, index: number): string {
  return image.currentSrc || image.src || `intro-image-${index + 1}`;
}

function getMediaUrl(media: HTMLMediaElement, index: number): string {
  return media.currentSrc || media.src || `intro-audio-${index + 1}`;
}

function createImageAsset(
  image: HTMLImageElement,
  index: number,
): PreloadAsset {
  const url = getImageUrl(image, index);

  return {
    url,
    start(onSettle) {
      let active = true;

      const cleanup = () => {
        if (!active) {
          return;
        }

        active = false;
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleError);
      };

      const settle = (status: PreloadAssetStatus) => {
        if (!active) {
          return;
        }

        cleanup();
        onSettle(status);
      };

      const handleDecode = () => {
        if (typeof image.decode !== 'function') {
          settle('loaded');
          return;
        }

        void image.decode().then(
          () => {
            settle('loaded');
          },
          () => {
            settle(image.naturalWidth > 0 ? 'loaded' : 'failed');
          },
        );
      };

      const handleLoad = () => {
        handleDecode();
      };

      const handleError = () => {
        settle('failed');
      };

      image.addEventListener('load', handleLoad);
      image.addEventListener('error', handleError);

      if (image.complete) {
        if (image.naturalWidth === 0) {
          settle('failed');
        } else {
          handleDecode();
        }
      }

      return cleanup;
    },
  };
}

function isAudioReady(audio: HTMLAudioElement): boolean {
  if (audio.readyState >= audio.HAVE_ENOUGH_DATA) {
    return true;
  }

  const { buffered } = audio;
  if (buffered.length === 0 || !Number.isFinite(audio.duration)) {
    return false;
  }

  try {
    return buffered.end(buffered.length - 1) >= audio.duration - AUDIO_BUFFER_TOLERANCE_SECONDS;
  } catch {
    return false;
  }
}

function createAudioAsset(
  audio: HTMLAudioElement,
  index: number,
): PreloadAsset {
  const url = getMediaUrl(audio, index);

  return {
    url,
    start(onSettle) {
      let active = true;

      const cleanup = () => {
        if (!active) {
          return;
        }

        active = false;
        audio.removeEventListener('canplaythrough', handleReadyCheck);
        audio.removeEventListener('loadeddata', handleReadyCheck);
        audio.removeEventListener('loadedmetadata', handleReadyCheck);
        audio.removeEventListener('progress', handleReadyCheck);
        audio.removeEventListener('suspend', handleReadyCheck);
        audio.removeEventListener('error', handleError);
      };

      const settle = (status: PreloadAssetStatus) => {
        if (!active) {
          return;
        }

        cleanup();
        onSettle(status);
      };

      const handleReadyCheck = () => {
        if (audio.error) {
          settle('failed');
          return;
        }

        if (isAudioReady(audio)) {
          settle('loaded');
        }
      };

      const handleError = () => {
        settle('failed');
      };

      audio.addEventListener('canplaythrough', handleReadyCheck);
      audio.addEventListener('loadeddata', handleReadyCheck);
      audio.addEventListener('loadedmetadata', handleReadyCheck);
      audio.addEventListener('progress', handleReadyCheck);
      audio.addEventListener('suspend', handleReadyCheck);
      audio.addEventListener('error', handleError);

      if (audio.networkState === audio.NETWORK_EMPTY) {
        audio.load();
      }

      handleReadyCheck();

      return cleanup;
    },
  };
}

function getImageAssets(root: HTMLElement): PreloadAsset[] {
  return Array.from(root.querySelectorAll('img')).map((image, index) =>
    createImageAsset(image, index),
  );
}

function getAudioAssets(audio: IntroAudioSession): PreloadAsset[] {
  const uniqueAudioByUrl = new Map<string, HTMLAudioElement>();

  for (const element of audio.getPreloadAudioElements()) {
    const url = getMediaUrl(element, uniqueAudioByUrl.size);

    if (!uniqueAudioByUrl.has(url)) {
      uniqueAudioByUrl.set(url, element);
    }
  }

  return Array.from(uniqueAudioByUrl.values()).map((element, index) =>
    createAudioAsset(element, index),
  );
}

export function startIntroPreload({
  root,
  audio,
  onProgress,
  timeoutMs = INTRO_PRELOAD_TIMEOUT_MS,
}: StartIntroPreloadOptions): IntroPreloadTask {
  const assets = [...getImageAssets(root), ...getAudioAssets(audio)];
  const pendingAssets = new Map<number, PreloadAsset>(
    assets.map((asset, index) => [index, asset]),
  );
  const cleanups = new Map<number, () => void>();
  const failedAssets: string[] = [];
  const totalCount = assets.length;
  let loadedCount = 0;
  let settled = false;
  let resolveDone: ((result: IntroPreloadResult) => void) | null = null;
  let timeoutId = 0;

  const done = new Promise<IntroPreloadResult>((resolve) => {
    resolveDone = resolve;
  });

  const emitProgress = (timedOutAssets: string[] = []) => {
    onProgress?.({
      loadedCount,
      totalCount,
      failedAssets: [...failedAssets],
      timedOutAssets,
    });
  };

  const finalize = ({
    cancelled,
    timedOutAssets,
  }: {
    cancelled: boolean;
    timedOutAssets: string[];
  }) => {
    if (settled) {
      return;
    }

    settled = true;
    window.clearTimeout(timeoutId);

    for (const cleanup of cleanups.values()) {
      cleanup();
    }

    cleanups.clear();

    if (!cancelled) {
      emitProgress(timedOutAssets);
    }

    resolveDone?.({
      cancelled,
      loadedCount,
      totalCount,
      failedAssets: [...failedAssets],
      timedOutAssets,
      timedOut: timedOutAssets.length > 0,
    });
  };

  emitProgress();

  if (totalCount === 0) {
    finalize({ cancelled: false, timedOutAssets: [] });

    return {
      cancel() {
        finalize({ cancelled: true, timedOutAssets: [] });
      },
      done,
      totalCount,
    };
  }

  timeoutId = window.setTimeout(() => {
    finalize({
      cancelled: false,
      timedOutAssets: Array.from(pendingAssets.values(), (asset) => asset.url),
    });
  }, timeoutMs);

  const handleAssetSettled = (assetId: number, status: PreloadAssetStatus) => {
    if (settled || !pendingAssets.has(assetId)) {
      return;
    }

    const asset = pendingAssets.get(assetId);

    pendingAssets.delete(assetId);
    cleanups.get(assetId)?.();
    cleanups.delete(assetId);

    loadedCount += 1;

    if (status === 'failed' && asset) {
      failedAssets.push(asset.url);
    }

    emitProgress();

    if (pendingAssets.size === 0) {
      finalize({ cancelled: false, timedOutAssets: [] });
    }
  };

  assets.forEach((asset, assetId) => {
    const cleanup = asset.start((status) => {
      handleAssetSettled(assetId, status);
    });

    if (pendingAssets.has(assetId)) {
      cleanups.set(assetId, cleanup);
    }
  });

  return {
    cancel() {
      finalize({ cancelled: true, timedOutAssets: [] });
    },
    done,
    totalCount,
  };
}
