import { afterEach, describe, expect, it, vi } from 'vitest';

import { runCountdown } from '../../src/shared/time/countdown';

describe('runCountdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports time and resolves at zero', async () => {
    vi.useFakeTimers();
    const ticks: number[] = [];
    const countdown = runCountdown(
      1_000,
      new AbortController().signal,
      (value) => ticks.push(value),
      250,
    );

    await vi.advanceTimersByTimeAsync(1_000);
    await expect(countdown).resolves.toBeUndefined();
    expect(ticks.at(0)).toBe(1_000);
    expect(ticks.at(-1)).toBe(0);
  });

  it('rejects immediately on abort and never reaches zero', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const ticks: number[] = [];
    const countdown = runCountdown(1_000, controller.signal, (value) =>
      ticks.push(value),
    );

    await vi.advanceTimersByTimeAsync(200);
    controller.abort(new DOMException('Stopped', 'AbortError'));
    await expect(countdown).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(ticks).not.toContain(0);
  });
});
