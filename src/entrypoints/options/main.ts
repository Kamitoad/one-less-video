import {
  loadSettings,
  saveSettings,
} from '../../shared/settings/settings-repository';
import { localizeDocument, translate } from '../../shared/i18n/i18n';
import {
  DEFAULT_SETTINGS,
  SETTINGS_LIMITS,
} from '../../shared/settings/settings-defaults';
import {
  validateSettings,
  type SettingsValidationError,
} from '../../shared/settings/settings-schema';
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

function replayShake(element: HTMLElement): void {
  element.classList.remove('validation-shake');
  void element.offsetWidth;
  element.classList.add('validation-shake');
}

function validationMessage(error: SettingsValidationError): string {
  switch (error) {
    case 'validationIntentLength':
      return translate(error, [
        SETTINGS_LIMITS.minimumIntentLength.min,
        SETTINGS_LIMITS.minimumIntentLength.max,
      ]);
    case 'validationChallengeLength':
      return translate(error, [
        SETTINGS_LIMITS.typingChallengeLength.min,
        SETTINGS_LIMITS.typingChallengeLength.max,
      ]);
    case 'validationCountdownRange':
    case 'validationCountdownOrder':
      return translate(error);
  }
}

async function initializeOptions(): Promise<void> {
  localizeDocument(document);
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
  let settings: Settings;
  let loadFailed = false;
  try {
    settings = await loadSettings();
  } catch (error: unknown) {
    console.error('OneLessVideo could not load settings.', error);
    settings = DEFAULT_SETTINGS;
    loadFailed = true;
  }

  enabled.checked = settings.enabled;
  requireReason.checked = settings.requireReason;
  requireIntent.checked = settings.requireIntentText;
  minimumIntentLength.value = settings.minimumIntentLength.toString();
  countdownMin.value = (settings.countdownMinMs / 1_000).toString();
  countdownMax.value = (settings.countdownMaxMs / 1_000).toString();
  requireChallenge.checked = settings.requireTypingChallenge;
  challengeLength.value = settings.typingChallengeLength.toString();
  randomizePosition.checked = settings.randomizeContinueButtonPosition;

  const validatedInputs = [
    minimumIntentLength,
    countdownMin,
    countdownMax,
    challengeLength,
  ];
  const controlsForError = (
    error: SettingsValidationError,
  ): readonly HTMLInputElement[] => {
    switch (error) {
      case 'validationIntentLength':
        return [minimumIntentLength];
      case 'validationCountdownRange':
      case 'validationCountdownOrder':
        return [countdownMin, countdownMax];
      case 'validationChallengeLength':
        return [challengeLength];
    }
  };

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
    validatedInputs.forEach((input) => {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    });
    if (errors.length > 0) {
      status.textContent = errors.map(validationMessage).join(' ');
      status.classList.add('error');
      const invalidInputs = new Set(errors.flatMap(controlsForError));
      invalidInputs.forEach((input) => {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', status.id);
      });
      invalidInputs.values().next().value?.focus();
      replayShake(status);
      return;
    }

    try {
      await saveSettings(updatedSettings);
      status.textContent = translate('settingsSaved');
      status.classList.remove('error', 'validation-shake');
    } catch (error: unknown) {
      console.error('OneLessVideo could not save settings.', error);
      status.textContent = translate('settingsSaveError');
      status.classList.add('error');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void persistSettings();
  });
  form.inert = false;
  form.setAttribute('aria-busy', 'false');
  if (loadFailed) {
    status.textContent = translate('settingsLoadError');
    status.classList.add('error');
    replayShake(status);
  }
}

void initializeOptions().catch((error: unknown) => {
  console.error('OneLessVideo options failed to initialize.', error);
});
