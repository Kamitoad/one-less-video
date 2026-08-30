import {
  loadSettings,
  saveSettings,
} from '../../shared/settings/settings-repository';
import { validateSettings } from '../../shared/settings/settings-schema';
import type { Settings } from '../../shared/settings/settings-types';
import './style.css';

function requiredElement<T extends HTMLElement>(
  id: string,
  type: { new (): T },
): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) {
    throw new Error(`Expected #${id} to be ${type.name}.`);
  }
  return element;
}

function readInteger(input: HTMLInputElement): number {
  return Number.parseInt(input.value, 10);
}

async function initializeOptions(): Promise<void> {
  const form = requiredElement('settings-form', HTMLFormElement);
  const status = requiredElement('status', HTMLParagraphElement);
  const enabled = requiredElement('enabled', HTMLInputElement);
  const requireReason = requiredElement('require-reason', HTMLInputElement);
  const requireIntent = requiredElement('require-intent', HTMLInputElement);
  const minimumIntentLength = requiredElement(
    'minimum-intent-length',
    HTMLInputElement,
  );
  const countdownMin = requiredElement('countdown-min', HTMLInputElement);
  const countdownMax = requiredElement('countdown-max', HTMLInputElement);
  const requireChallenge = requiredElement(
    'require-challenge',
    HTMLInputElement,
  );
  const challengeLength = requiredElement('challenge-length', HTMLInputElement);
  const randomizePosition = requiredElement(
    'randomize-position',
    HTMLInputElement,
  );
  const settings = await loadSettings();

  enabled.checked = settings.enabled;
  requireReason.checked = settings.requireReason;
  requireIntent.checked = settings.requireIntentText;
  minimumIntentLength.value = settings.minimumIntentLength.toString();
  countdownMin.value = (settings.countdownMinMs / 1_000).toString();
  countdownMax.value = (settings.countdownMaxMs / 1_000).toString();
  requireChallenge.checked = settings.requireTypingChallenge;
  challengeLength.value = settings.typingChallengeLength.toString();
  randomizePosition.checked = settings.randomizeContinueButtonPosition;

  const persistSettings = async (): Promise<void> => {
    const updatedSettings: Settings = {
      enabled: enabled.checked,
      requireReason: requireReason.checked,
      requireIntentText: requireIntent.checked,
      minimumIntentLength: readInteger(minimumIntentLength),
      countdownMinMs: readInteger(countdownMin) * 1_000,
      countdownMaxMs: readInteger(countdownMax) * 1_000,
      requireTypingChallenge: requireChallenge.checked,
      typingChallengeLength: readInteger(challengeLength),
      randomizeContinueButtonPosition: randomizePosition.checked,
    };
    const errors = validateSettings(updatedSettings);
    if (errors.length > 0) {
      status.textContent = errors.join(' ');
      status.classList.add('error');
      return;
    }

    try {
      await saveSettings(updatedSettings);
      status.textContent = 'Einstellungen gespeichert.';
      status.classList.remove('error');
    } catch (error: unknown) {
      console.error('OneLessVideo could not save settings.', error);
      status.textContent =
        'Die Einstellungen konnten nicht gespeichert werden.';
      status.classList.add('error');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void persistSettings();
  });
}

void initializeOptions().catch((error: unknown) => {
  console.error('OneLessVideo options failed to initialize.', error);
});
