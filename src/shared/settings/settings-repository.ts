import { browser } from 'wxt/browser';

import { createStoredSettings, parseStoredSettings } from './settings-schema';
import type { Settings } from './settings-types';

export const SETTINGS_STORAGE_KEY = 'onelessvideo.settings';

export async function loadSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(SETTINGS_STORAGE_KEY);
  return parseStoredSettings(stored[SETTINGS_STORAGE_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({
    [SETTINGS_STORAGE_KEY]: createStoredSettings(settings),
  });
}

export function subscribeToSettings(
  listener: (settings: Settings) => void,
): () => void {
  const handleChange: Parameters<
    typeof browser.storage.onChanged.addListener
  >[0] = (changes, areaName) => {
    const change = changes[SETTINGS_STORAGE_KEY];
    if (areaName === 'local' && change !== undefined) {
      listener(parseStoredSettings(change.newValue));
    }
  };

  browser.storage.onChanged.addListener(handleChange);
  return () => browser.storage.onChanged.removeListener(handleChange);
}
