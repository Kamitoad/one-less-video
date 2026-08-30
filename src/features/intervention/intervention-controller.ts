import type { RandomSource } from '../../shared/random/random-source';
import type { Settings } from '../../shared/settings/settings-types';
import { buildInterventionPlan } from './intervention-plan';
import type { InterventionState } from './intervention-state';
import type {
  InterventionOutcome,
  InterventionPlan,
  InterventionStage,
} from './intervention-types';

export interface PlayerLock {
  approve(): Promise<void>;
  release(): void;
}

export interface PlayerGateway {
  lock(signal: AbortSignal): PlayerLock;
}

export interface InterventionExperience {
  run(
    plan: InterventionPlan,
    signal: AbortSignal,
    onStageChange: (stage: InterventionStage) => void,
  ): Promise<InterventionOutcome>;
}

export interface InterventionControllerDependencies {
  experience: InterventionExperience;
  player: PlayerGateway;
  random: RandomSource;
  leaveCurrentPage: () => void;
  reportError?: (error: unknown) => void;
}

export class InterventionController {
  private settings: Settings;
  private state: InterventionState = { status: 'idle' };
  private currentVideoId: string | null = null;
  private activeAbort: AbortController | undefined;
  private activeLock: PlayerLock | undefined;
  private runId = 0;

  constructor(
    settings: Settings,
    private readonly dependencies: InterventionControllerDependencies,
  ) {
    this.settings = settings;
  }

  getState(): InterventionState {
    return this.state;
  }

  handleNavigation(videoId: string | null): void {
    if (videoId === this.currentVideoId) {
      return;
    }

    this.cancelActiveRun();
    this.currentVideoId = videoId;

    if (videoId === null || !this.settings.enabled) {
      this.state = { status: 'idle' };
      return;
    }

    this.startRun(videoId);
  }

  updateSettings(settings: Settings): void {
    const wasEnabled = this.settings.enabled;
    this.settings = settings;

    if (!settings.enabled) {
      this.cancelActiveRun();
      this.state = { status: 'idle' };
      return;
    }

    if (!wasEnabled && this.currentVideoId !== null) {
      this.startRun(this.currentVideoId);
    }
  }

  dispose(): void {
    this.cancelActiveRun();
    this.currentVideoId = null;
    this.state = { status: 'idle' };
  }

  private cancelActiveRun(): void {
    this.runId += 1;
    this.activeAbort?.abort(
      new DOMException('Intervention superseded.', 'AbortError'),
    );
    this.activeAbort = undefined;
    this.activeLock?.release();
    this.activeLock = undefined;
  }

  private startRun(videoId: string): void {
    const runId = ++this.runId;
    const abortController = new AbortController();
    this.activeAbort = abortController;
    this.state = { status: 'locking', videoId };

    const playerLock = this.dependencies.player.lock(abortController.signal);
    this.activeLock = playerLock;
    const plan = buildInterventionPlan(this.settings, this.dependencies.random);

    void this.performRun(runId, videoId, plan, playerLock, abortController);
  }

  private async performRun(
    runId: number,
    videoId: string,
    plan: InterventionPlan,
    playerLock: PlayerLock,
    abortController: AbortController,
  ): Promise<void> {
    const isCurrent = (): boolean =>
      this.runId === runId &&
      this.currentVideoId === videoId &&
      !abortController.signal.aborted;

    try {
      this.state = { status: 'asking-intent', videoId, plan };
      const outcome = await this.dependencies.experience.run(
        plan,
        abortController.signal,
        (stage) => {
          if (isCurrent()) {
            this.state = { status: stage, videoId, plan };
          }
        },
      );

      if (!isCurrent()) {
        return;
      }

      if (outcome === 'approved') {
        this.state = { status: 'approved', videoId };
        this.activeLock = undefined;
        await playerLock.approve();
      } else {
        this.state = { status: 'aborted', videoId };
        playerLock.release();
        this.activeLock = undefined;
        this.dependencies.leaveCurrentPage();
      }
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return;
      }

      // OneLessVideo is productivity tooling, not a security boundary. Internal failures fail open.
      playerLock.release();
      this.activeLock = undefined;
      this.state = { status: 'idle' };
      this.dependencies.reportError?.(error);
    } finally {
      playerLock.release();
      if (this.runId === runId) {
        this.activeAbort = undefined;
        this.activeLock = undefined;
      }
    }
  }
}
