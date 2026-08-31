import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SETTINGS,
  SETTINGS_LIMITS,
} from '../../src/shared/settings/settings-defaults';
import {
  createStoredSettings,
  normalizeSettings,
  parseStoredSettings,
  validateSettings,
} from '../../src/shared/settings/settings-schema';

describe('settings schema', () => {
  it('returns defaults for missing or unsupported stored data', () => {
    expect(parseStoredSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseStoredSettings({ schemaVersion: 2, settings: {} })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('normalizes valid version-one settings field by field', () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      enabled: false,
      minimumIntentLength: 42,
      countdownMinMs: 1_000,
      countdownMaxMs: 2_000,
      typingChallengeLength: 8,
    });

    expect(settings).toMatchObject({
      enabled: false,
      minimumIntentLength: 42,
      countdownMinMs: 1_000,
      countdownMaxMs: 2_000,
      typingChallengeLength: 8,
    });
  });

  it('falls back safely for invalid values and an inverted countdown range', () => {
    expect(
      normalizeSettings({
        enabled: 'yes',
        minimumIntentLength: -1,
        countdownMinMs: 10_000,
        countdownMaxMs: 5_000,
        typingChallengeLength: 99,
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('creates a versioned storage envelope', () => {
    expect(
      createStoredSettings({ ...DEFAULT_SETTINGS, enabled: false }),
    ).toEqual({
      schemaVersion: 1,
      settings: { ...DEFAULT_SETTINGS, enabled: false },
    });
  });

  it('reports bounds and ordering errors', () => {
    const errors = validateSettings({
      ...DEFAULT_SETTINGS,
      minimumIntentLength: SETTINGS_LIMITS.minimumIntentLength.max + 1,
      countdownMinMs: 8_000,
      countdownMaxMs: 7_000,
      typingChallengeLength: SETTINGS_LIMITS.typingChallengeLength.min - 1,
    });

    expect(errors).toEqual([
      'validationIntentLength',
      'validationCountdownOrder',
      'validationChallengeLength',
    ]);
  });
});
