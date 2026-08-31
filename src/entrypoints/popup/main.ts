import { browser } from 'wxt/browser';

import {
  loadSettings,
  saveSettings,
} from '../../shared/settings/settings-repository';
import { localizeDocument, translate } from '../../shared/i18n/i18n';
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
  localizeDocument(document);
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
        ? translate('interventionsEnabled')
        : translate('interventionsDisabled');
      status.classList.remove('error');
    } catch (error: unknown) {
      console.error('OneLessVideo could not save the enabled setting.', error);
      enabled.checked = settings.enabled;
      status.textContent = translate('settingSaveError');
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
