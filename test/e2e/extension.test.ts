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
  await options.getByRole('button', { name: 'Save settings' }).click();
  await expect(options.locator('#status')).toHaveText('Settings saved.');
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

test('shows accessible inline settings errors instead of native validation UI', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(options.locator('#settings-form')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  const countdownMin = options.locator('#countdown-min');

  await countdownMin.fill('121');
  await options.getByRole('button', { name: 'Save settings' }).click();

  const status = options.locator('#status');
  await expect(status).toHaveText(
    'The countdown must be between 0 and 120 seconds.',
  );
  await expect(status).toHaveClass(/validation-shake/);
  await expect(countdownMin).toHaveAttribute('aria-invalid', 'true');
  await expect(countdownMin).toBeFocused();
});

test('completes the intentional viewing flow and removes the lock UI', async ({
  context,
  extensionId,
}) => {
  await configureExtension(context, extensionId, 0);
  const page = await context.newPage();
  await openControlledVideo(page);
  const overlay = page.locator('#onelessvideo-intervention-root');

  await overlay.getByLabel('Learning', { exact: true }).check();
  await overlay
    .getByLabel('Why is this video the right choice right now?')
    .pressSequentially(
      'Ich recherchiere dieses Thema für meine aktuelle Aufgabe.',
    );
  await expect(page.locator('html')).toHaveAttribute('data-shortcut-hits', '0');
  await overlay.getByRole('button', { name: 'Continue' }).click();

  const challenge = await overlay.locator('.challenge-code').textContent();
  if (challenge === null) {
    throw new Error('Expected a typing challenge.');
  }
  const challengeInput = overlay.getByLabel('Enter code');
  await challengeInput.fill(challenge.toLowerCase());
  await expect(challengeInput).toHaveValue(challenge);
  await overlay.getByRole('button', { name: 'Continue' }).click();
  const approve = overlay.getByRole('button', {
    name: 'Hold for 3 seconds',
  });
  await approve.hover();
  await page.mouse.down();
  await page.waitForTimeout(3_100);
  await page.mouse.up();

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
    'Why is this video the right choice right now?',
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
  const enabled = popup.getByLabel('Enabled');
  await expect(enabled).toBeChecked();
  await enabled.uncheck();

  await expect(page.locator('#onelessvideo-intervention-root')).toBeHidden();
  await expect(popup.locator('#status')).toHaveText('Interventions disabled.');
});
