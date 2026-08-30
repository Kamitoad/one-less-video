export function getYouTubeVideoId(url: URL): string | null {
  const isYouTubeHost =
    url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com';
  if (!isYouTubeHost || url.pathname !== '/watch') {
    return null;
  }

  const videoId = url.searchParams.get('v')?.trim();
  return videoId === undefined || videoId.length === 0 ? null : videoId;
}
