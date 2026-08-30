import { describe, expect, it } from 'vitest';

import {
  buildInterventionPlan,
  createTypingChallenge,
  TYPING_CHALLENGE_CHARACTERS,
} from '../../src/features/intervention/intervention-plan';
import { CONTINUE_BUTTON_POSITIONS } from '../../src/features/intervention/intervention-types';
import type { RandomSource } from '../../src/shared/random/random-source';
import { DEFAULT_SETTINGS } from '../../src/shared/settings/settings-defaults';

class SequenceRandom implements RandomSource {
  private index = 0;

  constructor(private readonly values: readonly number[]) {}

  next(): number {
    const value = this.values[this.index % this.values.length];
    this.index += 1;
    return value ?? 0;
  }
}

describe('intervention plan', () => {
  it('builds deterministic values within configured bounds', () => {
    const plan = buildInterventionPlan(
      { ...DEFAULT_SETTINGS, countdownMinMs: 5_000, countdownMaxMs: 10_000 },
      new SequenceRandom([0.5, 0, 0.1, 0.2, 0.3, 0.4, 0.99]),
    );

    expect(plan.countdownMs).toBeGreaterThanOrEqual(5_000);
    expect(plan.countdownMs).toBeLessThanOrEqual(10_000);
    expect(plan.challenge.type).toBe('typing-code');
    if (plan.challenge.type === 'typing-code') {
      expect(plan.challenge.value).toHaveLength(
        DEFAULT_SETTINGS.typingChallengeLength,
      );
      expect(
        [...plan.challenge.value].every((character) =>
          TYPING_CHALLENGE_CHARACTERS.includes(character),
        ),
      ).toBe(true);
    }
    expect(CONTINUE_BUTTON_POSITIONS).toContain(plan.continueButtonPosition);
  });

  it('creates a code without visually ambiguous characters', () => {
    const code = createTypingChallenge(
      12,
      new SequenceRandom([0, 0.25, 0.5, 0.75, 0.99]),
    );
    expect(code).toHaveLength(12);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it('can disable optional friction and position randomization', () => {
    const plan = buildInterventionPlan(
      {
        ...DEFAULT_SETTINGS,
        requireTypingChallenge: false,
        randomizeContinueButtonPosition: false,
      },
      new SequenceRandom([0.5]),
    );

    expect(plan.challenge).toEqual({ type: 'none' });
    expect(plan.continueButtonPosition).toBe('bottom-right');
  });
});
