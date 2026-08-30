export function getAbortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException('Operation aborted.', 'AbortError');
}

export function runCountdown(
  durationMs: number,
  signal: AbortSignal,
  onTick: (remainingMs: number) => void,
  tickMs = 100,
): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(getAbortError(signal));
  }

  const safeDuration = Math.max(0, durationMs);
  onTick(safeDuration);
  if (safeDuration === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const endAt = Date.now() + safeDuration;

    const cleanup = (): void => {
      clearInterval(timer);
      signal.removeEventListener('abort', handleAbort);
    };

    const handleAbort = (): void => {
      cleanup();
      reject(getAbortError(signal));
    };

    const update = (): void => {
      const remainingMs = Math.max(0, endAt - Date.now());
      onTick(remainingMs);
      if (remainingMs === 0) {
        cleanup();
        resolve();
      }
    };

    const timer = setInterval(update, Math.min(tickMs, safeDuration));
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}
