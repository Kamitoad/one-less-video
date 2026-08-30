// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.youtube.com/watch?v=VIDEO_A"}

import { afterEach, describe, expect, it, vi } from 'vitest';

import { watchYouTubeNavigation } from '../../src/platform/youtube/youtube-navigation';

describe('watchYouTubeNavigation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('observes initial, WXT, YouTube, and polling navigation without duplicates', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const changes: Array<string | null> = [];
    watchYouTubeNavigation(window, controller.signal, (videoId) =>
      changes.push(videoId),
    );
    expect(changes).toEqual(['VIDEO_A']);

    history.pushState({}, '', '/watch?v=VIDEO_B');
    window.dispatchEvent(new Event('wxt:locationchange'));
    document.dispatchEvent(new Event('yt-navigate-finish'));
    expect(changes).toEqual(['VIDEO_A', 'VIDEO_B']);

    history.pushState({}, '', '/watch?v=VIDEO_C');
    await vi.advanceTimersByTimeAsync(500);
    expect(changes).toEqual(['VIDEO_A', 'VIDEO_B', 'VIDEO_C']);

    controller.abort();
    history.pushState({}, '', '/watch?v=VIDEO_D');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(changes).toEqual(['VIDEO_A', 'VIDEO_B', 'VIDEO_C']);
  });
});
