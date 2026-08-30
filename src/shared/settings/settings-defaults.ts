import type { Settings } from './settings-types';

export const SETTINGS_LIMITS = {
  minimumIntentLength: { min: 0, max: 500 },
  countdownMs: { min: 0, max: 120_000 },
  typingChallengeLength: { min: 3, max: 12 },
} as const;

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  enabled: true,
  requireReason: true,
  requireIntentText: true,
  minimumIntentLength: 15,
  countdownMinMs: 5_000,
  countdownMaxMs: 10_000,
  requireTypingChallenge: true,
  typingChallengeLength: 5,
  randomizeContinueButtonPosition: true,
};
