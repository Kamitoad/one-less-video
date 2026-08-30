import { InterventionController } from '../features/intervention/intervention-controller';
import { InterventionOverlay } from '../features/intervention/ui/intervention-overlay';
import { watchYouTubeNavigation } from '../platform/youtube/youtube-navigation';
import { createYouTubePlayerGateway } from '../platform/youtube/youtube-player';
import { mathRandomSource } from '../shared/random/random-source';
import { DEFAULT_SETTINGS } from '../shared/settings/settings-defaults';
import {
  loadSettings,
  subscribeToSettings,
} from '../shared/settings/settings-repository';

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_start',
  async main(context) {
    const lifecycle = new AbortController();
    let settings = { ...DEFAULT_SETTINGS };

    try {
      settings = await loadSettings();
    } catch (error: unknown) {
      console.error(
        'OneLessVideo could not load settings and will use defaults.',
        error,
      );
    }

    const controller = new InterventionController(settings, {
      experience: new InterventionOverlay(document),
      player: createYouTubePlayerGateway(document),
      random: mathRandomSource,
      leaveCurrentPage: () => {
        if (history.length > 1) {
          history.back();
        } else {
          location.assign('about:blank');
        }
      },
      reportError: (error) =>
        console.error(
          'OneLessVideo released the player after an internal failure.',
          error,
        ),
    });

    const unsubscribe = subscribeToSettings((updatedSettings) => {
      controller.updateSettings(updatedSettings);
    });
    const stopNavigation = watchYouTubeNavigation(
      window,
      lifecycle.signal,
      (videoId) => {
        controller.handleNavigation(videoId);
      },
    );

    const shutdown = (): void => {
      if (lifecycle.signal.aborted) {
        return;
      }
      lifecycle.abort(
        new DOMException('Content script stopped.', 'AbortError'),
      );
      stopNavigation();
      unsubscribe();
      controller.dispose();
    };

    context.addEventListener(window, 'pagehide', shutdown, { once: true });
    context.onInvalidated(shutdown);
  },
});
