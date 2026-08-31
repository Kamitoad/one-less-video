// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import germanMessages from '../../public/_locales/de/messages.json';
import englishMessages from '../../public/_locales/en/messages.json';

const i18nMock = vi.hoisted(() => ({
  getMessage: vi.fn<(key: string, substitutions?: string[]) => string>(),
  getUILanguage: vi.fn<() => string>(),
}));

vi.mock('wxt/browser', () => ({
  browser: {
    i18n: i18nMock,
  },
}));

import {
  isMessageKey,
  localizeDocument,
  translate,
} from '../../src/shared/i18n/i18n';

function placeholders(message: string): string[] {
  return [...message.matchAll(/\$\d+/gu)].map(([value]) => value).sort();
}

describe('localization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18nMock.getMessage.mockReturnValue('');
    i18nMock.getUILanguage.mockReturnValue('en-US');
  });

  it('keeps English and German message keys and placeholders in parity', () => {
    expect(Object.keys(germanMessages).sort()).toEqual(
      Object.keys(englishMessages).sort(),
    );

    for (const key of Object.keys(englishMessages)) {
      expect(isMessageKey(key)).toBe(true);
      const english = englishMessages[key as keyof typeof englishMessages];
      const german = germanMessages[key as keyof typeof germanMessages];
      expect(english.message.trim()).not.toBe('');
      expect(german.message.trim()).not.toBe('');
      expect(placeholders(german.message)).toEqual(
        placeholders(english.message),
      );
    }
  });

  it('uses the English catalog as the default fallback with substitutions', () => {
    expect(translate('intentTooShort', [15])).toBe(
      'Please enter at least 15 characters.',
    );
  });

  it('uses browser localization and updates static document language and copy', () => {
    i18nMock.getUILanguage.mockReturnValue('de-DE');
    i18nMock.getMessage.mockImplementation((key) =>
      key === 'settingsButton' ? 'Einstellungen' : '',
    );
    document.body.innerHTML =
      '<button data-i18n="settingsButton">Settings</button>';

    localizeDocument(document);

    expect(document.documentElement.lang).toBe('de-DE');
    expect(document.querySelector('button')?.textContent).toBe('Einstellungen');
  });
});
