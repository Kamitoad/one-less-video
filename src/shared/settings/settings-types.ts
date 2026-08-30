export interface Settings {
  enabled: boolean;
  requireReason: boolean;
  requireIntentText: boolean;
  minimumIntentLength: number;
  countdownMinMs: number;
  countdownMaxMs: number;
  requireTypingChallenge: boolean;
  typingChallengeLength: number;
  randomizeContinueButtonPosition: boolean;
}

export interface StoredSettings {
  schemaVersion: 1;
  settings: Settings;
}
