import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SETTINGS } from '../../src/shared/settings/settings-defaults';

const browserMock = vi.hoisted(() => {
  let listener:
    | ((
        changes: Record<string, { newValue?: unknown }>,
        areaName: string,
      ) => void)
    | undefined;
  const local = {
    get: vi.fn(),
    set: vi.fn(),
  };
  const onChanged = {
    addListener: vi.fn(
      (
        next: (
          changes: Record<string, { newValue?: unknown }>,
          areaName: string,
        ) => void,
      ) => {
        listener = next;
      },
    ),
    removeListener: vi.fn(),
  };
  return {
    local,
    onChanged,
    emit(changes: Record<string, { newValue?: unknown }>, areaName = 'local') {
      listener?.(changes, areaName);
    },
  };
});

vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: browserMock.local,
      onChanged: browserMock.onChanged,
    },
  },
}));

import {
  loadSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  subscribeToSettings,
} from '../../src/shared/settings/settings-repository';

describe('settings repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and validates persisted settings', async () => {
    browserMock.local.get.mockResolvedValue({
      [SETTINGS_STORAGE_KEY]: {
        schemaVersion: 1,
        settings: { ...DEFAULT_SETTINGS, enabled: false },
      },
    });

    await expect(loadSettings()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      enabled: false,
    });
    expect(browserMock.local.get).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
  });

  it('saves a versioned settings envelope', async () => {
    browserMock.local.set.mockResolvedValue(undefined);
    await saveSettings({ ...DEFAULT_SETTINGS, enabled: false });

    expect(browserMock.local.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: {
        schemaVersion: 1,
        settings: { ...DEFAULT_SETTINGS, enabled: false },
      },
    });
  });

  it('normalizes local storage changes and unsubscribes cleanly', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSettings(listener);
    browserMock.emit({
      [SETTINGS_STORAGE_KEY]: {
        newValue: {
          schemaVersion: 1,
          settings: { ...DEFAULT_SETTINGS, enabled: false },
        },
      },
    });

    expect(listener).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      enabled: false,
    });
    unsubscribe();
    expect(browserMock.onChanged.removeListener).toHaveBeenCalledOnce();
  });
});
