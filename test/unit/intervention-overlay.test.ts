// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InterventionOverlay } from '../../src/features/intervention/ui/intervention-overlay';
import type { InterventionPlan } from '../../src/features/intervention/intervention-types';

const PLAN: InterventionPlan = {
  requireReason: true,
  requireIntentText: true,
  minimumIntentLength: 15,
  countdownMs: 0,
  challenge: { type: 'typing-code', value: 'K7P4X' },
  continueButtonPosition: 'middle-right',
};

function shadowRoot(): ShadowRoot {
  const root = document.getElementById(
    'onelessvideo-intervention-root',
  )?.shadowRoot;
  if (root === null || root === undefined) {
    throw new Error('Expected the OneLessVideo shadow root.');
  }
  return root;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('InterventionOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    document.getElementById('onelessvideo-intervention-root')?.remove();
  });

  it('validates intent, challenge, and renders one stable decision button', async () => {
    const stages: string[] = [];
    const run = new InterventionOverlay(document).run(
      PLAN,
      new AbortController().signal,
      (stage) => stages.push(stage),
    );
    let root = shadowRoot();
    const intentForm = root.querySelector('form');
    expect(intentForm).not.toBeNull();
    intentForm?.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    expect(root.querySelector('.error')?.textContent).toContain('Grund');

    const reason = root.querySelector<HTMLInputElement>(
      'input[name="watch-reason"]',
    );
    const intent = root.querySelector<HTMLTextAreaElement>('#olv-intent');
    if (reason === null || intent === null || intentForm === null) {
      throw new Error('Expected the intent controls.');
    }
    const pageKeyHandler = vi.fn();
    document.addEventListener('keydown', pageKeyHandler);
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'k',
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    intent.dispatchEvent(keyEvent);
    expect(pageKeyHandler).not.toHaveBeenCalled();
    expect(keyEvent.defaultPrevented).toBe(false);
    document.removeEventListener('keydown', pageKeyHandler);

    reason.checked = true;
    intent.value = 'Zu diesem Thema recherchiere ich gerade.';
    intentForm.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => {
      expect(shadowRoot().querySelector('#olv-challenge')).not.toBeNull();
    });

    root = shadowRoot();
    const challengeInput =
      root.querySelector<HTMLInputElement>('#olv-challenge');
    const challengeForm = root.querySelector('form');
    if (challengeInput === null || challengeForm === null) {
      throw new Error('Expected the challenge controls.');
    }
    challengeInput.value = 'WRONG';
    challengeForm.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    expect(root.querySelector('.error')?.textContent).toContain('stimmt');
    challengeInput.value = 'K7P4X';
    challengeForm.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await flushPromises();

    root = shadowRoot();
    const approve = root.querySelector<HTMLButtonElement>('.continue-button');
    expect(approve?.classList.contains('position-middle-right')).toBe(true);
    expect(
      document.querySelectorAll('#onelessvideo-intervention-root'),
    ).toHaveLength(1);
    if (approve === null) {
      throw new Error('Expected the approval button.');
    }

    vi.useFakeTimers();
    approve.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    await vi.advanceTimersByTimeAsync(2_999);
    expect(shadowRoot().querySelector('.continue-button')).not.toBeNull();
    window.dispatchEvent(new MouseEvent('pointerup'));
    await vi.advanceTimersByTimeAsync(3_000);
    expect(shadowRoot().querySelector('.continue-button')).not.toBeNull();

    approve.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    await vi.advanceTimersByTimeAsync(3_000);

    await expect(run).resolves.toBe('approved');
    expect(
      document.getElementById('onelessvideo-intervention-root'),
    ).toBeNull();
    expect(stages).toEqual([
      'asking-intent',
      'countdown',
      'challenge',
      'decision',
    ]);
  });

  it('removes itself immediately when aborted', async () => {
    const controller = new AbortController();
    const run = new InterventionOverlay(document).run(
      PLAN,
      controller.signal,
      () => undefined,
    );
    controller.abort(new DOMException('Navigation changed', 'AbortError'));

    await expect(run).rejects.toMatchObject({ name: 'AbortError' });
    expect(
      document.getElementById('onelessvideo-intervention-root'),
    ).toBeNull();
  });
});
