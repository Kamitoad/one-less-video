import { getYouTubeVideoId } from './youtube-video-id';

const YOUTUBE_NAVIGATION_EVENT = 'yt-navigate-finish';
const WXT_NAVIGATION_EVENT = 'wxt:locationchange';

export function watchYouTubeNavigation(
  targetWindow: Window,
  signal: AbortSignal,
  onVideoChange: (videoId: string | null) => void,
): () => void {
  let lastHref: string | undefined;

  const checkLocation = (): void => {
    if (signal.aborted || targetWindow.location.href === lastHref) {
      return;
    }

    lastHref = targetWindow.location.href;
    onVideoChange(getYouTubeVideoId(new URL(lastHref)));
  };

  const cleanup = (): void => {
    clearInterval(pollTimer);
    targetWindow.removeEventListener('popstate', checkLocation);
    targetWindow.removeEventListener(WXT_NAVIGATION_EVENT, checkLocation);
    targetWindow.document.removeEventListener(
      YOUTUBE_NAVIGATION_EVENT,
      checkLocation,
    );
    signal.removeEventListener('abort', cleanup);
  };

  targetWindow.addEventListener('popstate', checkLocation);
  targetWindow.addEventListener(WXT_NAVIGATION_EVENT, checkLocation);
  targetWindow.document.addEventListener(
    YOUTUBE_NAVIGATION_EVENT,
    checkLocation,
  );
  signal.addEventListener('abort', cleanup, { once: true });
  const pollTimer = targetWindow.setInterval(checkLocation, 500);
  checkLocation();

  return cleanup;
}
