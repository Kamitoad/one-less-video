export const COPY = {
  title: 'Ein Video weniger',
  intentHeading: 'Warum möchtest du dieses Video ansehen?',
  intentPrompt: 'Warum ist dieses Video gerade die richtige Entscheidung?',
  intentTooShort: (minimum: number) =>
    `Bitte gib mindestens ${minimum} Zeichen ein.`,
  reasonRequired: 'Bitte wähle einen Grund aus.',
  continue: 'Weiter',
  countdownHeading:
    'Du hast dich entschieden, weitere Zeit auf YouTube zu verbringen.',
  countdownPrompt: 'Bitte warte:',
  challengeHeading: 'Tippe folgenden Code:',
  challengeMismatch: 'Der Code stimmt noch nicht überein.',
  back: 'Zurück zu meiner Aufgabe',
  watch: '3 Sekunden gedrückt halten',
  watchHolding: (remainingSeconds: number) =>
    `Noch ${remainingSeconds} ${remainingSeconds === 1 ? 'Sekunde' : 'Sekunden'} halten`,
} as const;

export const WATCH_REASONS = [
  'Lernen',
  'Uni / Arbeit',
  'Musik',
  'Unterhaltung',
  'Langeweile',
  'Gewohnheit',
  'Kein klarer Grund',
  'Sonstiges',
] as const;
