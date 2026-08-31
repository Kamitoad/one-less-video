import { DEFAULT_SETTINGS, SETTINGS_LIMITS } from './settings-defaults';
import type { Settings, StoredSettings } from './settings-types';

export type SettingsValidationError =
  | 'validationIntentLength'
  | 'validationCountdownRange'
  | 'validationCountdownOrder'
  | 'validationChallengeLength';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readBoolean(
  source: Record<string, unknown>,
  key: keyof Settings,
  fallback: boolean,
): boolean {
  return typeof source[key] === 'boolean' ? source[key] : fallback;
}

function readBoundedInteger(
  source: Record<string, unknown>,
  key: keyof Settings,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = source[key];
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : fallback;
}

export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  let countdownMinMs = readBoundedInteger(
    value,
    'countdownMinMs',
    DEFAULT_SETTINGS.countdownMinMs,
    SETTINGS_LIMITS.countdownMs.min,
    SETTINGS_LIMITS.countdownMs.max,
  );
  let countdownMaxMs = readBoundedInteger(
    value,
    'countdownMaxMs',
    DEFAULT_SETTINGS.countdownMaxMs,
    SETTINGS_LIMITS.countdownMs.min,
    SETTINGS_LIMITS.countdownMs.max,
  );

  if (countdownMinMs > countdownMaxMs) {
    countdownMinMs = DEFAULT_SETTINGS.countdownMinMs;
    countdownMaxMs = DEFAULT_SETTINGS.countdownMaxMs;
  }

  return {
    enabled: readBoolean(value, 'enabled', DEFAULT_SETTINGS.enabled),
    requireReason: readBoolean(
      value,
      'requireReason',
      DEFAULT_SETTINGS.requireReason,
    ),
    requireIntentText: readBoolean(
      value,
      'requireIntentText',
      DEFAULT_SETTINGS.requireIntentText,
    ),
    minimumIntentLength: readBoundedInteger(
      value,
      'minimumIntentLength',
      DEFAULT_SETTINGS.minimumIntentLength,
      SETTINGS_LIMITS.minimumIntentLength.min,
      SETTINGS_LIMITS.minimumIntentLength.max,
    ),
    countdownMinMs,
    countdownMaxMs,
    requireTypingChallenge: readBoolean(
      value,
      'requireTypingChallenge',
      DEFAULT_SETTINGS.requireTypingChallenge,
    ),
    typingChallengeLength: readBoundedInteger(
      value,
      'typingChallengeLength',
      DEFAULT_SETTINGS.typingChallengeLength,
      SETTINGS_LIMITS.typingChallengeLength.min,
      SETTINGS_LIMITS.typingChallengeLength.max,
    ),
    randomizeContinueButtonPosition: readBoolean(
      value,
      'randomizeContinueButtonPosition',
      DEFAULT_SETTINGS.randomizeContinueButtonPosition,
    ),
  };
}

export function parseStoredSettings(value: unknown): Settings {
  if (!isRecord(value) || value.schemaVersion !== 1 || !('settings' in value)) {
    return { ...DEFAULT_SETTINGS };
  }

  return normalizeSettings(value.settings);
}

export function createStoredSettings(settings: Settings): StoredSettings {
  return {
    schemaVersion: 1,
    settings: normalizeSettings(settings),
  };
}

export function validateSettings(
  settings: Settings,
): SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];
  const intent = SETTINGS_LIMITS.minimumIntentLength;
  const countdown = SETTINGS_LIMITS.countdownMs;
  const challenge = SETTINGS_LIMITS.typingChallengeLength;

  if (
    !Number.isInteger(settings.minimumIntentLength) ||
    settings.minimumIntentLength < intent.min ||
    settings.minimumIntentLength > intent.max
  ) {
    errors.push('validationIntentLength');
  }

  if (
    !Number.isInteger(settings.countdownMinMs) ||
    settings.countdownMinMs < countdown.min ||
    settings.countdownMinMs > countdown.max ||
    !Number.isInteger(settings.countdownMaxMs) ||
    settings.countdownMaxMs < countdown.min ||
    settings.countdownMaxMs > countdown.max
  ) {
    errors.push('validationCountdownRange');
  } else if (settings.countdownMinMs > settings.countdownMaxMs) {
    errors.push('validationCountdownOrder');
  }

  if (
    !Number.isInteger(settings.typingChallengeLength) ||
    settings.typingChallengeLength < challenge.min ||
    settings.typingChallengeLength > challenge.max
  ) {
    errors.push('validationChallengeLength');
  }

  return errors;
}
