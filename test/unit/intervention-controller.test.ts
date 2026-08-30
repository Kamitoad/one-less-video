import { describe, expect, it, vi } from 'vitest';

import {
  InterventionController,
  type InterventionExperience,
  type PlayerGateway,
  type PlayerLock,
} from '../../src/features/intervention/intervention-controller';
import type {
  InterventionOutcome,
  InterventionPlan,
  InterventionStage,
} from '../../src/features/intervention/intervention-types';
import type { RandomSource } from '../../src/shared/random/random-source';
import { DEFAULT_SETTINGS } from '../../src/shared/settings/settings-defaults';

interface PendingExperience {
  signal: AbortSignal;
  resolve: (outcome: InterventionOutcome) => void;
}

interface TrackedLock extends PlayerLock {
  approve: ReturnType<typeof vi.fn<() => Promise<void>>>;
  release: ReturnType<typeof vi.fn<() => void>>;
}

function createHarness() {
  const pending: PendingExperience[] = [];
  const locks: TrackedLock[] = [];
  const experience: InterventionExperience = {
    run: (
      _plan: InterventionPlan,
      signal: AbortSignal,
      onStageChange: (stage: InterventionStage) => void,
    ) => {
      onStageChange('countdown');
      return new Promise((resolve) => pending.push({ signal, resolve }));
    },
  };
  const player: PlayerGateway = {
    lock: () => {
      const lock: TrackedLock = {
        approve: vi.fn(() => Promise.resolve()),
        release: vi.fn(),
      };
      locks.push(lock);
      return lock;
    },
  };
  const random: RandomSource = { next: () => 0 };
  const leaveCurrentPage = vi.fn();
  const reportError = vi.fn();
  const controller = new InterventionController(
    { ...DEFAULT_SETTINGS },
    {
      experience,
      player,
      random,
      leaveCurrentPage,
      reportError,
    },
  );

  return { controller, pending, locks, leaveCurrentPage, reportError };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('InterventionController', () => {
  it('starts one intervention for repeated signals of the same video', () => {
    const { controller, pending, locks } = createHarness();

    controller.handleNavigation('video-a');
    controller.handleNavigation('video-a');

    expect(pending).toHaveLength(1);
    expect(locks).toHaveLength(1);
    expect(controller.getState()).toMatchObject({
      status: 'countdown',
      videoId: 'video-a',
    });
  });

  it('prevents a stale run from approving a newer video', async () => {
    const { controller, pending, locks } = createHarness();
    controller.handleNavigation('video-a');
    controller.handleNavigation('video-b');

    expect(pending[0]?.signal.aborted).toBe(true);
    pending[0]?.resolve('approved');
    await flushPromises();

    expect(locks[0]?.approve).not.toHaveBeenCalled();
    expect(locks[1]?.release).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({ videoId: 'video-b' });

    pending[1]?.resolve('approved');
    await flushPromises();
    expect(locks[1]?.approve).toHaveBeenCalledOnce();
    expect(controller.getState()).toEqual({
      status: 'approved',
      videoId: 'video-b',
    });
  });

  it('releases all work immediately when disabled and restarts when enabled', () => {
    const { controller, pending, locks } = createHarness();
    controller.handleNavigation('video-a');
    controller.updateSettings({ ...DEFAULT_SETTINGS, enabled: false });

    expect(pending[0]?.signal.aborted).toBe(true);
    expect(locks[0]?.release).toHaveBeenCalled();
    expect(controller.getState()).toEqual({ status: 'idle' });

    controller.updateSettings({ ...DEFAULT_SETTINGS, enabled: true });
    expect(locks).toHaveLength(2);
  });

  it('releases the player and leaves after the user aborts', async () => {
    const { controller, pending, locks, leaveCurrentPage } = createHarness();
    controller.handleNavigation('video-a');
    pending[0]?.resolve('aborted');
    await flushPromises();

    expect(locks[0]?.release).toHaveBeenCalled();
    expect(leaveCurrentPage).toHaveBeenCalledOnce();
    expect(controller.getState()).toEqual({
      status: 'aborted',
      videoId: 'video-a',
    });
  });

  it('fails open and reports an unexpected experience error', async () => {
    const lock: TrackedLock = {
      approve: vi.fn(() => Promise.resolve()),
      release: vi.fn(),
    };
    const reportError = vi.fn();
    const controller = new InterventionController(
      { ...DEFAULT_SETTINGS },
      {
        experience: {
          run: () => Promise.reject(new Error('broken overlay')),
        },
        player: { lock: () => lock },
        random: { next: () => 0 },
        leaveCurrentPage: vi.fn(),
        reportError,
      },
    );

    controller.handleNavigation('video-a');
    await flushPromises();

    expect(lock.release).toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledOnce();
    expect(controller.getState()).toEqual({ status: 'idle' });
  });
});
