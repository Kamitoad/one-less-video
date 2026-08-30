import type {
  PlayerGateway,
  PlayerLock,
} from '../../features/intervention/intervention-controller';

const VIDEO_SELECTOR = 'video.html5-main-video, #movie_player video, video';

class YouTubePlayerLock implements PlayerLock {
  private active = true;
  private currentVideo: HTMLVideoElement | undefined;
  private observer: MutationObserver | undefined;
  private pollTimer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly document: Document,
    private readonly signal: AbortSignal,
  ) {
    this.signal.addEventListener('abort', this.release, { once: true });
    this.attachToCurrentPlayer();
    this.startObservingPlayerReplacement();
    this.pollTimer = setInterval(() => this.attachToCurrentPlayer(), 250);
  }

  approve = async (): Promise<void> => {
    const video = this.currentVideo;
    this.release();

    if (video !== undefined) {
      try {
        await video.play();
      } catch (error: unknown) {
        console.warn(
          'OneLessVideo could not resume playback after approval.',
          error,
        );
      }
    }
  };

  release = (): void => {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.detachFromVideo();
    this.observer?.disconnect();
    this.observer = undefined;
    this.document.removeEventListener(
      'DOMContentLoaded',
      this.attachAfterDomReady,
    );
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.signal.removeEventListener('abort', this.release);
  };

  private readonly blockPlayback = (): void => {
    if (
      this.active &&
      this.currentVideo !== undefined &&
      !this.currentVideo.paused
    ) {
      this.currentVideo.pause();
    }
  };

  private attachToCurrentPlayer(): void {
    if (!this.active) {
      return;
    }

    const video =
      this.document.querySelector<HTMLVideoElement>(VIDEO_SELECTOR) ??
      undefined;
    if (video === this.currentVideo) {
      this.blockPlayback();
      return;
    }

    this.detachFromVideo();
    this.currentVideo = video;
    this.currentVideo?.addEventListener('play', this.blockPlayback);
    this.blockPlayback();
  }

  private detachFromVideo(): void {
    this.currentVideo?.removeEventListener('play', this.blockPlayback);
    this.currentVideo = undefined;
  }

  private startObservingPlayerReplacement(): void {
    const root = this.document.documentElement;
    if (root === null) {
      this.document.addEventListener(
        'DOMContentLoaded',
        this.attachAfterDomReady,
        { once: true },
      );
      return;
    }

    this.observer = new MutationObserver(() => this.attachToCurrentPlayer());
    this.observer.observe(root, { childList: true, subtree: true });
  }

  private readonly attachAfterDomReady = (): void => {
    if (this.active) {
      this.startObservingPlayerReplacement();
      this.attachToCurrentPlayer();
    }
  };
}

export function createYouTubePlayerGateway(document: Document): PlayerGateway {
  return {
    lock: (signal) => new YouTubePlayerLock(document, signal),
  };
}
