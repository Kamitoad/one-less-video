export const CONTINUE_BUTTON_POSITIONS = [
  'top-left',
  'top-right',
  'middle-left',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

type ContinueButtonPosition = (typeof CONTINUE_BUTTON_POSITIONS)[number];

export type InterventionChallenge =
  { type: 'typing-code'; value: string } | { type: 'none' };

export interface InterventionPlan {
  requireReason: boolean;
  requireIntentText: boolean;
  minimumIntentLength: number;
  countdownMs: number;
  challenge: InterventionChallenge;
  continueButtonPosition: ContinueButtonPosition;
}

export type InterventionStage =
  'asking-intent' | 'countdown' | 'challenge' | 'decision';

export type InterventionOutcome = 'approved' | 'aborted';
