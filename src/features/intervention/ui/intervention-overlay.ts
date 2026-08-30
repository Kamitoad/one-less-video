import { COPY, WATCH_REASONS } from '../../../shared/copy';
import { getAbortError, runCountdown } from '../../../shared/time/countdown';
import type { InterventionExperience } from '../intervention-controller';
import type {
  InterventionOutcome,
  InterventionPlan,
  InterventionStage,
} from '../intervention-types';
import overlayStyles from './intervention-overlay.css?raw';

const OVERLAY_HOST_ID = 'onelessvideo-intervention-root';

interface MountedOverlay {
  host: HTMLElement;
  dialog: HTMLElement;
  content: HTMLElement;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className !== undefined) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function waitForValidatedSubmit(
  form: HTMLFormElement,
  signal: AbortSignal,
  validate: () => boolean,
): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(getAbortError(signal));
  }

  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      form.removeEventListener('submit', handleSubmit);
      signal.removeEventListener('abort', handleAbort);
    };
    const handleSubmit = (event: SubmitEvent): void => {
      event.preventDefault();
      if (validate()) {
        cleanup();
        resolve();
      }
    };
    const handleAbort = (): void => {
      cleanup();
      reject(getAbortError(signal));
    };

    form.addEventListener('submit', handleSubmit);
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

function waitForDecision(
  approveButton: HTMLButtonElement,
  abortButton: HTMLButtonElement,
  signal: AbortSignal,
): Promise<InterventionOutcome> {
  if (signal.aborted) {
    return Promise.reject(getAbortError(signal));
  }

  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      approveButton.removeEventListener('click', handleApprove);
      abortButton.removeEventListener('click', handleAbortDecision);
      signal.removeEventListener('abort', handleSignalAbort);
    };
    const handleApprove = (): void => {
      cleanup();
      resolve('approved');
    };
    const handleAbortDecision = (): void => {
      cleanup();
      resolve('aborted');
    };
    const handleSignalAbort = (): void => {
      cleanup();
      reject(getAbortError(signal));
    };

    approveButton.addEventListener('click', handleApprove);
    abortButton.addEventListener('click', handleAbortDecision);
    signal.addEventListener('abort', handleSignalAbort, { once: true });
  });
}

function formatRemainingTime(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1_000);
  const minutesPart = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secondsPart = (seconds % 60).toString().padStart(2, '0');
  return `${minutesPart}:${secondsPart}`;
}

export class InterventionOverlay implements InterventionExperience {
  constructor(private readonly document: Document) {}

  async run(
    plan: InterventionPlan,
    signal: AbortSignal,
    onStageChange: (stage: InterventionStage) => void,
  ): Promise<InterventionOutcome> {
    signal.throwIfAborted();
    const mounted = this.mount();

    try {
      onStageChange('asking-intent');
      await this.askForIntent(mounted, plan, signal);

      onStageChange('countdown');
      await this.showCountdown(mounted, plan.countdownMs, signal);

      if (plan.challenge.type === 'typing-code') {
        onStageChange('challenge');
        await this.askForChallenge(mounted, plan.challenge.value, signal);
      }

      onStageChange('decision');
      return await this.askForDecision(mounted, plan, signal);
    } finally {
      mounted.host.remove();
    }
  }

  private mount(): MountedOverlay {
    this.document.getElementById(OVERLAY_HOST_ID)?.remove();

    const host = createElement(this.document, 'div');
    host.id = OVERLAY_HOST_ID;
    const shadow = host.attachShadow({ mode: 'open' });
    const style = createElement(this.document, 'style');
    style.textContent = overlayStyles;
    const backdrop = createElement(this.document, 'div', 'backdrop');
    const dialog = createElement(this.document, 'section', 'dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'olv-dialog-title');
    dialog.tabIndex = -1;
    const eyebrow = createElement(
      this.document,
      'p',
      'eyebrow',
      'OneLessVideo',
    );
    const content = createElement(this.document, 'div');

    dialog.append(eyebrow, content);
    backdrop.append(dialog);
    shadow.append(style, backdrop);
    host.addEventListener('keydown', (event) => {
      this.keepFocusInside(event, shadow);
      event.stopPropagation();
    });
    host.addEventListener('keyup', (event) => event.stopPropagation());
    host.addEventListener('keypress', (event) => event.stopPropagation());
    this.document.documentElement.append(host);
    dialog.focus();

    return { host, dialog, content };
  }

  private async askForIntent(
    mounted: MountedOverlay,
    plan: InterventionPlan,
    signal: AbortSignal,
  ): Promise<void> {
    const form = createElement(this.document, 'form');
    const title = createElement(
      this.document,
      'h1',
      undefined,
      COPY.intentHeading,
    );
    title.id = 'olv-dialog-title';
    const error = createElement(this.document, 'p', 'error');
    error.setAttribute('role', 'status');
    error.setAttribute('aria-live', 'polite');
    let firstControl: HTMLElement | undefined;

    form.append(title);
    if (plan.requireReason) {
      const fieldset = createElement(this.document, 'fieldset');
      const legend = createElement(
        this.document,
        'legend',
        undefined,
        'Grund auswählen',
      );
      fieldset.append(legend);
      WATCH_REASONS.forEach((reason, index) => {
        const label = createElement(this.document, 'label', 'reason');
        const input = createElement(this.document, 'input');
        input.type = 'radio';
        input.name = 'watch-reason';
        input.value = reason;
        input.required = true;
        const labelText = createElement(
          this.document,
          'span',
          undefined,
          reason,
        );
        label.append(input, labelText);
        fieldset.append(label);
        if (index === 0) {
          firstControl = input;
        }
      });
      form.append(fieldset);
    }

    let intentInput: HTMLTextAreaElement | undefined;
    if (plan.requireIntentText) {
      const label = createElement(
        this.document,
        'label',
        'text-label',
        COPY.intentPrompt,
      );
      label.htmlFor = 'olv-intent';
      intentInput = createElement(this.document, 'textarea');
      intentInput.id = 'olv-intent';
      intentInput.name = 'intent';
      intentInput.required = true;
      intentInput.minLength = plan.minimumIntentLength;
      const hint = createElement(
        this.document,
        'p',
        'hint',
        `Mindestens ${plan.minimumIntentLength} Zeichen. Der Text wird nicht gespeichert.`,
      );
      form.append(label, intentInput, hint);
      firstControl ??= intentInput;
    }

    const actions = createElement(this.document, 'div', 'actions');
    const submit = createElement(
      this.document,
      'button',
      'primary',
      COPY.continue,
    );
    submit.type = 'submit';
    actions.append(submit);
    form.append(error, actions);
    mounted.content.replaceChildren(form);
    firstControl ??= submit;
    firstControl.focus();

    await waitForValidatedSubmit(form, signal, () => {
      if (
        plan.requireReason &&
        form.elements.namedItem('watch-reason') === null
      ) {
        error.textContent = COPY.reasonRequired;
        return false;
      }
      if (
        plan.requireReason &&
        !form.querySelector('input[name="watch-reason"]:checked')
      ) {
        error.textContent = COPY.reasonRequired;
        return false;
      }
      if (
        intentInput !== undefined &&
        intentInput.value.trim().length < plan.minimumIntentLength
      ) {
        error.textContent = COPY.intentTooShort(plan.minimumIntentLength);
        intentInput.focus();
        return false;
      }
      error.textContent = '';
      return true;
    });
  }

  private async showCountdown(
    mounted: MountedOverlay,
    countdownMs: number,
    signal: AbortSignal,
  ): Promise<void> {
    const title = createElement(
      this.document,
      'h1',
      undefined,
      COPY.countdownHeading,
    );
    title.id = 'olv-dialog-title';
    const prompt = createElement(
      this.document,
      'p',
      undefined,
      COPY.countdownPrompt,
    );
    const timer = createElement(this.document, 'p', 'countdown');
    timer.setAttribute('role', 'timer');
    timer.setAttribute('aria-live', 'off');
    mounted.content.replaceChildren(title, prompt, timer);
    mounted.dialog.focus();

    await runCountdown(countdownMs, signal, (remainingMs) => {
      timer.textContent = formatRemainingTime(remainingMs);
      timer.setAttribute(
        'aria-label',
        `${Math.ceil(remainingMs / 1_000)} Sekunden verbleiben`,
      );
    });
  }

  private async askForChallenge(
    mounted: MountedOverlay,
    challenge: string,
    signal: AbortSignal,
  ): Promise<void> {
    const form = createElement(this.document, 'form');
    const title = createElement(
      this.document,
      'h1',
      undefined,
      COPY.challengeHeading,
    );
    title.id = 'olv-dialog-title';
    const code = createElement(this.document, 'p', 'challenge-code', challenge);
    const label = createElement(
      this.document,
      'label',
      'text-label',
      'Code eingeben',
    );
    label.htmlFor = 'olv-challenge';
    const input = createElement(this.document, 'input', 'challenge-input');
    input.id = 'olv-challenge';
    input.name = 'challenge';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.maxLength = challenge.length;
    input.required = true;
    input.setAttribute('autocapitalize', 'characters');
    const error = createElement(this.document, 'p', 'error');
    error.setAttribute('role', 'status');
    const actions = createElement(this.document, 'div', 'actions');
    const submit = createElement(
      this.document,
      'button',
      'primary',
      COPY.continue,
    );
    submit.type = 'submit';
    actions.append(submit);
    form.append(title, code, label, input, error, actions);
    mounted.content.replaceChildren(form);
    input.focus();

    await waitForValidatedSubmit(form, signal, () => {
      if (input.value !== challenge) {
        error.textContent = COPY.challengeMismatch;
        input.select();
        return false;
      }
      return true;
    });
  }

  private askForDecision(
    mounted: MountedOverlay,
    plan: InterventionPlan,
    signal: AbortSignal,
  ): Promise<InterventionOutcome> {
    const title = createElement(
      this.document,
      'h1',
      undefined,
      'Triff eine bewusste Entscheidung.',
    );
    title.id = 'olv-dialog-title';
    const copy = createElement(
      this.document,
      'p',
      'decision-copy',
      'Du kannst zu deiner vorherigen Aufgabe zurückkehren oder dieses Video jetzt bewusst ansehen.',
    );
    const abortButton = createElement(
      this.document,
      'button',
      'back-button',
      COPY.back,
    );
    abortButton.type = 'button';
    const grid = createElement(this.document, 'div', 'continue-grid');
    const approveButton = createElement(
      this.document,
      'button',
      `primary continue-button position-${plan.continueButtonPosition}`,
      COPY.watch,
    );
    approveButton.type = 'button';
    grid.append(approveButton);
    mounted.content.replaceChildren(title, copy, abortButton, grid);
    abortButton.focus();

    return waitForDecision(approveButton, abortButton, signal);
  }

  private keepFocusInside(event: KeyboardEvent, shadow: ShadowRoot): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = Array.from(
      shadow.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    const first = focusable.at(0);
    const last = focusable.at(-1);
    const active = shadow.activeElement;

    if (first === undefined || last === undefined) {
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
