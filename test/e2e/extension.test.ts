import type { BrowserContext, Page } from '@playwright/test';

import { expect, test } from './fixtures';

const TEST_PAGE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Controlled YouTube fixture</title></head>
  <body>
    <main>
      <h1>Controlled video page</h1>
      <div id="movie_player"><video class="html5-main-video" muted></video></div>
    </main>
    <script>
      document.documentElement.dataset.shortcutHits = '0';
      document.addEventListener('keydown', () => {
        const current = Number(document.documentElement.dataset.shortcutHits ?? '0');
        document.documentElement.dataset.shortcutHits = String(current + 1);
      });
    </script>
  </body>
</html>`;

async function configureExtension(
  context: BrowserContext,
  extensionId: string,
  countdownSeconds: number,
): Promise<void> {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(options.locator('#countdown-min')).toHaveValue('5');
  await options.locator('#countdown-min').fill(countdownSeconds.toString());
  await options.locator('#countdown-max').fill(countdownSeconds.toString());
  await options
    .getByRole('button', { name: 'Einstellungen speichern' })
    .click();
  await expect(options.locator('#status')).toHaveText(
    'Einstellungen gespeichert.',
  );
  await options.close();
}

async function openControlledVideo(
  page: Page,
  videoId = 'TEST_VIDEO_A',
): Promise<void> {
  await page.route('https://www.youtube.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: TEST_PAGE }),
  );
  await page.goto(`https://www.youtube.com/watch?v=${videoId}`);
  await expect(page.locator('#onelessvideo-intervention-root')).toBeVisible();
}

test('completes the intentional viewing flow and removes the lock UI', async ({
  context,
  extensionId,
}) => {
  await configureExtension(context, extensionId, 0);
  const page = await context.newPage();
  await openControlledVideo(page);
  const overlay = page.locator('#onelessvideo-intervention-root');

  await overlay.getByLabel('Lernen', { exact: true }).check();
  await overlay
    .getByLabel('Warum ist dieses Video gerade die richtige Entscheidung?')
    .pressSequentially(
      'Ich recherchiere dieses Thema für meine aktuelle Aufgabe.',
    );
  await expect(page.locator('html')).toHaveAttribute('data-shortcut-hits', '0');
  await overlay.getByRole('button', { name: 'Weiter' }).click();

  const challenge = await overlay.locator('.challenge-code').textContent();
  if (challenge === null) {
    throw new Error('Expected a typing challenge.');
  }
  await overlay.getByLabel('Code eingeben').fill(challenge);
  await overlay.getByRole('button', { name: 'Weiter' }).click();
  await overlay.getByRole('button', { name: 'Video ansehen' }).click();

  await expect(overlay).toBeHidden();
});

test('restarts on SPA navigation and ignores duplicate navigation signals', async ({
  context,
  extensionId,
}) => {
  await configureExtension(context, extensionId, 0);
  const page = await context.newPage();
  await openControlledVideo(page);
  const overlay = page.locator('#onelessvideo-intervention-root');
  const intent = overlay.getByLabel(
    'Warum ist dieses Video gerade die richtige Entscheidung?',
  );
  await intent.fill('Text from video A that must be discarded.');

  await page.evaluate(() => {
    history.pushState({}, '', '/watch?v=TEST_VIDEO_B');
    document.dispatchEvent(new Event('yt-navigate-finish'));
  });
  await expect(intent).toHaveValue('');
  await intent.fill('This value must survive duplicate signals.');

  await page.evaluate(() => {
    document.dispatchEvent(new Event('yt-navigate-finish'));
    document.dispatchEvent(new Event('yt-navigate-finish'));
    window.dispatchEvent(new Event('wxt:locationchange'));
  });
  await expect(intent).toHaveValue(
    'This value must survive duplicate signals.',
  );
  await expect(page.locator('#onelessvideo-intervention-root')).toHaveCount(1);
});

test('disabling from the popup removes an active intervention immediately', async ({
  context,
  extensionId,
}) => {
  await configureExtension(context, extensionId, 0);
  const page = await context.newPage();
  await openControlledVideo(page);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const enabled = popup.getByLabel('Aktiviert');
  await expect(enabled).toBeChecked();
  await enabled.uncheck();

  await expect(page.locator('#onelessvideo-intervention-root')).toBeHidden();
  await expect(popup.locator('#status')).toHaveText(
    'Interventionen deaktiviert.',
  );
});
