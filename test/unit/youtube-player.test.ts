// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createYouTubePlayerGateway } from '../../src/platform/youtube/youtube-player';

interface ControlledVideo {
  element: HTMLVideoElement;
  pause: ReturnType<typeof vi.fn<() => void>>;
  play: ReturnType<typeof vi.fn<() => Promise<void>>>;
  setPaused: (value: boolean) => void;
}

function createControlledVideo(): ControlledVideo {
  const element = document.createElement('video');
  element.className = 'html5-main-video';
  let paused = false;
  const pause = vi.fn(() => {
    paused = true;
  });
  const play = vi.fn(() => {
    paused = false;
    return Promise.resolve();
  });
  Object.defineProperty(element, 'paused', { get: () => paused });
  Object.defineProperty(element, 'pause', { value: pause });
  Object.defineProperty(element, 'play', { value: play });
  return { element, pause, play, setPaused: (value) => (paused = value) };
}

async function flushMutationObserver(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('YouTube player lock', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('pauses the player and blocks subsequent play events until release', () => {
    const video = createControlledVideo();
    document.body.append(video.element);
    const lock = createYouTubePlayerGateway(document).lock(
      new AbortController().signal,
    );

    expect(video.pause).toHaveBeenCalled();
    video.setPaused(false);
    video.element.dispatchEvent(new Event('play'));
    expect(video.pause).toHaveBeenCalledTimes(2);

    lock.release();
    video.setPaused(false);
    video.element.dispatchEvent(new Event('play'));
    expect(video.pause).toHaveBeenCalledTimes(2);
  });

  it('moves the lock to a replacement video element', async () => {
    const first = createControlledVideo();
    document.body.append(first.element);
    const lock = createYouTubePlayerGateway(document).lock(
      new AbortController().signal,
    );
    const replacement = createControlledVideo();

    first.element.replaceWith(replacement.element);
    await flushMutationObserver();

    expect(replacement.pause).toHaveBeenCalled();
    replacement.setPaused(false);
    replacement.element.dispatchEvent(new Event('play'));
    expect(replacement.pause).toHaveBeenCalledTimes(2);
    lock.release();
  });

  it('releases before resuming an approved video', async () => {
    const video = createControlledVideo();
    document.body.append(video.element);
    const lock = createYouTubePlayerGateway(document).lock(
      new AbortController().signal,
    );

    await lock.approve();
    expect(video.play).toHaveBeenCalledOnce();
    video.setPaused(false);
    video.element.dispatchEvent(new Event('play'));
    expect(video.pause).toHaveBeenCalledOnce();
  });

  it('fails open when resuming playback is rejected', async () => {
    const video = createControlledVideo();
    video.play.mockRejectedValue(
      new DOMException('Not allowed', 'NotAllowedError'),
    );
    document.body.append(video.element);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const lock = createYouTubePlayerGateway(document).lock(
      new AbortController().signal,
    );

    await expect(lock.approve()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });
});
