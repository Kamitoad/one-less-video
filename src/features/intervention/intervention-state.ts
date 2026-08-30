import type { InterventionPlan, InterventionStage } from './intervention-types';

export type InterventionState =
  | { status: 'idle' }
  | { status: 'locking'; videoId: string }
  | { status: InterventionStage; videoId: string; plan: InterventionPlan }
  | { status: 'approved'; videoId: string }
  | { status: 'aborted'; videoId: string };
