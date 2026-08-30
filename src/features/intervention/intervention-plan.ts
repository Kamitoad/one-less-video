import {
  randomInteger,
  randomItem,
  type RandomSource,
} from '../../shared/random/random-source';
import type { Settings } from '../../shared/settings/settings-types';
import {
  CONTINUE_BUTTON_POSITIONS,
  type InterventionChallenge,
  type InterventionPlan,
} from './intervention-types';

export const TYPING_CHALLENGE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TYPING_CHALLENGE_CHARACTER_LIST = [...TYPING_CHALLENGE_CHARACTERS];

export function createTypingChallenge(
  length: number,
  random: RandomSource,
): string {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += randomItem(TYPING_CHALLENGE_CHARACTER_LIST, random);
  }
  return result;
}

export function buildInterventionPlan(
  settings: Settings,
  random: RandomSource,
): InterventionPlan {
  const challenge: InterventionChallenge = settings.requireTypingChallenge
    ? {
        type: 'typing-code',
        value: createTypingChallenge(settings.typingChallengeLength, random),
      }
    : { type: 'none' };

  return {
    requireReason: settings.requireReason,
    requireIntentText: settings.requireIntentText,
    minimumIntentLength: settings.minimumIntentLength,
    countdownMs: randomInteger(
      settings.countdownMinMs,
      settings.countdownMaxMs,
      random,
    ),
    challenge,
    continueButtonPosition: settings.randomizeContinueButtonPosition
      ? randomItem(CONTINUE_BUTTON_POSITIONS, random)
      : 'bottom-right',
  };
}
