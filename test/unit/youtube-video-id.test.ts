import { describe, expect, it } from 'vitest';

import { getYouTubeVideoId } from '../../src/platform/youtube/youtube-video-id';

describe('getYouTubeVideoId', () => {
  it('extracts the id from a regular watch URL', () => {
    expect(
      getYouTubeVideoId(new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')),
    ).toBe('dQw4w9WgXcQ');
  });

  it('accepts the bare youtube.com host', () => {
    expect(
      getYouTubeVideoId(new URL('https://youtube.com/watch?v=video-a&t=10')),
    ).toBe('video-a');
  });

  it.each([
    'https://www.youtube.com/watch',
    'https://www.youtube.com/',
    'https://www.youtube.com/shorts/example',
    'https://music.youtube.com/watch?v=example',
    'https://example.com/watch?v=example',
    'https://www.youtube.com/watch?v=%20%20',
  ])('returns null for unsupported URL %s', (url) => {
    expect(getYouTubeVideoId(new URL(url))).toBeNull();
  });
});
