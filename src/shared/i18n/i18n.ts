import { browser } from 'wxt/browser';

import defaultMessages from '../../../public/_locales/en/messages.json';

export type MessageKey = Extract<keyof typeof defaultMessages, string>;

export const WATCH_REASON_KEYS = [
  'reasonLearn',
  'reasonStudyWork',
  'reasonMusic',
  'reasonEntertainment',
  'reasonBoredom',
  'reasonHabit',
  'reasonNoClearReason',
  'reasonOther',
] as const satisfies readonly MessageKey[];

export function isMessageKey(value: string): value is MessageKey {
  return Object.hasOwn(defaultMessages, value);
}

function fallbackMessage(
  key: MessageKey,
  substitutions: readonly string[],
): string {
  const definition = defaultMessages[key];
  return substitutions.reduce(
    (message, substitution, index) =>
      message.replaceAll(`$${index + 1}`, substitution),
    definition.message,
  );
}

export function translate(
  key: MessageKey,
  substitutions: readonly (string | number)[] = [],
): string {
  const normalizedSubstitutions = substitutions.map(String);

  try {
    const localized =
      normalizedSubstitutions.length === 0
        ? browser.i18n.getMessage(key)
        : browser.i18n.getMessage(key, normalizedSubstitutions);
    if (localized !== '') {
      return localized;
    }
  } catch {
    // Unit tests and non-extension previews use the English source catalog.
  }

  return fallbackMessage(key, normalizedSubstitutions);
}

function getUiLanguage(): string {
  try {
    return browser.i18n.getUILanguage() || 'en';
  } catch {
    return 'en';
  }
}

export function localizeDocument(document: Document): void {
  document.documentElement.lang = getUiLanguage();

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (key !== undefined && isMessageKey(key)) {
      element.textContent = translate(key);
    }
  });
}
