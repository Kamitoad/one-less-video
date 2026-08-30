import { browser } from 'wxt/browser';

import {
  loadSettings,
  saveSettings,
} from '../../shared/settings/settings-repository';
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

async function initializePopup(): Promise<void> {
  const enabled = requiredElement('enabled', HTMLInputElement);
  const status = requiredElement('status', HTMLParagraphElement);
  const openSettings = requiredElement('open-settings', HTMLButtonElement);
  const settings = await loadSettings();
  enabled.checked = settings.enabled;

  const persistEnabledSetting = async (): Promise<void> => {
    enabled.disabled = true;
    try {
      await saveSettings({ ...settings, enabled: enabled.checked });
      settings.enabled = enabled.checked;
      status.textContent = enabled.checked
        ? 'Interventionen aktiviert.'
        : 'Interventionen deaktiviert.';
      status.classList.remove('error');
    } catch (error: unknown) {
      console.error('OneLessVideo could not save the enabled setting.', error);
      enabled.checked = settings.enabled;
      status.textContent = 'Die Einstellung konnte nicht gespeichert werden.';
      status.classList.add('error');
    } finally {
      enabled.disabled = false;
    }
  };

  enabled.addEventListener('change', () => {
    void persistEnabledSetting();
  });

  openSettings.addEventListener('click', () => {
    void browser.runtime.openOptionsPage();
  });
}

void initializePopup().catch((error: unknown) => {
  console.error('OneLessVideo popup failed to initialize.', error);
});
