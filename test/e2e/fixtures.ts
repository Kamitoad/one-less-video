import path from 'node:path';

import { chromium, test as base, type BrowserContext } from '@playwright/test';

export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({ browserName }, use, testInfo) => {
    if (browserName !== 'chromium') {
      throw new Error('OneLessVideo extension E2E tests require Chromium.');
    }
    const extensionPath = path.resolve('.output/chrome-mv3');
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    const launchOptions: NonNullable<
      Parameters<typeof chromium.launchPersistentContext>[1]
    > = {
      headless: true,
      locale: 'en-US',
      reducedMotion: 'no-preference',
      args: [
        '--lang=en-US',
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    };
    if (executablePath === undefined) {
      launchOptions.channel = 'chromium';
    } else {
      launchOptions.executablePath = executablePath;
    }
    const context = await chromium.launchPersistentContext(
      testInfo.outputPath('browser-profile'),
      launchOptions,
    );

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions');
    const extension = extensionsPage
      .locator('extensions-item')
      .filter({ hasText: 'OneLessVideo' });
    await extension.waitFor();
    const extensionId = await extension.getAttribute('id');
    await extensionsPage.close();
    if (extensionId === null) {
      throw new Error(
        'Could not determine the loaded OneLessVideo extension ID.',
      );
    }
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
