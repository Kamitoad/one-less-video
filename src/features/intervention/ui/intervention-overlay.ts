import { translate, WATCH_REASON_KEYS } from '../../../shared/i18n/i18n';
import { getAbortError, runCountdown } from '../../../shared/time/countdown';
import type { InterventionExperience } from '../intervention-controller';
import type {
  InterventionOutcome,
  InterventionPlan,
  InterventionStage,
} from '../intervention-types';
import overlayStyles from './intervention-overlay.css?raw';

const OVERLAY_HOST_ID = 'onelessvideo-intervention-root';
const APPROVAL_HOLD_MS = 3_000;

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

function showValidationError(
  form: HTMLFormElement,
  error: HTMLElement,
  message: string,
  invalidControl: HTMLElement,
): void {
  form
    .querySelectorAll<HTMLElement>('[aria-invalid="true"]')
    .forEach((control) => {
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
    });
  error.textContent = message;
  invalidControl.setAttribute('aria-invalid', 'true');
  invalidControl.setAttribute('aria-describedby', error.id);
  error.classList.remove('validation-shake');
  void error.offsetWidth;
  error.classList.add('validation-shake');
  invalidControl.focus();
}

function clearValidationError(form: HTMLFormElement, error: HTMLElement): void {
  form
    .querySelectorAll<HTMLElement>('[aria-invalid="true"]')
    .forEach((control) => {
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
    });
  error.textContent = '';
  error.classList.remove('validation-shake');
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
    let approvalTimer: ReturnType<typeof setTimeout> | undefined;
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    let holdStartedAt: number | undefined;

    const resetHold = (): void => {
      if (approvalTimer !== undefined) {
        clearTimeout(approvalTimer);
        approvalTimer = undefined;
      }
      if (progressTimer !== undefined) {
        clearInterval(progressTimer);
        progressTimer = undefined;
      }
      holdStartedAt = undefined;
      approveButton.classList.remove('is-holding');
      approveButton.textContent = translate('watchHoldButton');
    };
    const cleanup = (): void => {
      resetHold();
      approveButton.removeEventListener('click', preventShortClick);
      approveButton.removeEventListener('pointerdown', handlePointerDown);
      approveButton.removeEventListener('pointerleave', resetHold);
      approveButton.removeEventListener('pointercancel', resetHold);
      approveButton.removeEventListener('keydown', handleKeyDown);
      approveButton.removeEventListener('keyup', handleKeyUp);
      approveButton.removeEventListener('blur', resetHold);
      approveButton.ownerDocument.defaultView?.removeEventListener(
        'pointerup',
        resetHold,
      );
      abortButton.removeEventListener('click', handleAbortDecision);
      signal.removeEventListener('abort', handleSignalAbort);
    };
    const approve = (): void => {
      cleanup();
      resolve('approved');
    };
    const updateProgressLabel = (): void => {
      if (holdStartedAt === undefined) {
        return;
      }
      const remainingMs = Math.max(
        0,
        APPROVAL_HOLD_MS - (Date.now() - holdStartedAt),
      );
      const remainingSeconds = Math.ceil(remainingMs / 1_000);
      approveButton.textContent = translate(
        remainingSeconds === 1 ? 'watchHoldingOne' : 'watchHoldingMany',
        [remainingSeconds],
      );
    };
    const startHold = (): void => {
      if (holdStartedAt !== undefined) {
        return;
      }
      holdStartedAt = Date.now();
      approveButton.classList.add('is-holding');
      updateProgressLabel();
      progressTimer = setInterval(updateProgressLabel, 100);
      approvalTimer = setTimeout(approve, APPROVAL_HOLD_MS);
    };
    const preventShortClick = (event: MouseEvent): void => {
      event.preventDefault();
    };
    const handlePointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || event.isPrimary === false) {
        return;
      }
      event.preventDefault();
      startHold();
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault();
        startHold();
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        resetHold();
      }
    };
    const handleAbortDecision = (): void => {
      cleanup();
      resolve('aborted');
    };
    const handleSignalAbort = (): void => {
      cleanup();
      reject(getAbortError(signal));
    };

    approveButton.addEventListener('click', preventShortClick);
    approveButton.addEventListener('pointerdown', handlePointerDown);
    approveButton.addEventListener('pointerleave', resetHold);
    approveButton.addEventListener('pointercancel', resetHold);
    approveButton.addEventListener('keydown', handleKeyDown);
    approveButton.addEventListener('keyup', handleKeyUp);
    approveButton.addEventListener('blur', resetHold);
    approveButton.ownerDocument.defaultView?.addEventListener(
      'pointerup',
      resetHold,
    );
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
      translate('extensionName'),
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
    form.noValidate = true;
    const title = createElement(
      this.document,
      'h1',
      undefined,
      translate('intentHeading'),
    );
    title.id = 'olv-dialog-title';
    const error = createElement(this.document, 'p', 'error');
    error.id = 'olv-validation-error';
    error.setAttribute('role', 'status');
    error.setAttribute('aria-live', 'polite');
    error.setAttribute('aria-atomic', 'true');
    let firstControl: HTMLElement | undefined;

    form.append(title);
    if (plan.requireReason) {
      const fieldset = createElement(this.document, 'fieldset');
      const legend = createElement(
        this.document,
        'legend',
        undefined,
        translate('reasonLegend'),
      );
      fieldset.append(legend);
      WATCH_REASON_KEYS.forEach((reasonKey, index) => {
        const reason = translate(reasonKey);
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
        translate('intentPrompt'),
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
        translate('minimumCharactersHint', [plan.minimumIntentLength]),
      );
      form.append(label, intentInput, hint);
      firstControl ??= intentInput;
    }

    const actions = createElement(this.document, 'div', 'actions');
    const submit = createElement(
      this.document,
      'button',
      'primary',
      translate('continueButton'),
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
        showValidationError(form, error, translate('reasonRequired'), submit);
        return false;
      }
      if (
        plan.requireReason &&
        !form.querySelector('input[name="watch-reason"]:checked')
      ) {
        const firstReason = form.querySelector<HTMLInputElement>(
          'input[name="watch-reason"]',
        );
        showValidationError(
          form,
          error,
          translate('reasonRequired'),
          firstReason ?? submit,
        );
        return false;
      }
      if (
        intentInput !== undefined &&
        intentInput.value.trim().length < plan.minimumIntentLength
      ) {
        showValidationError(
          form,
          error,
          translate('intentTooShort', [plan.minimumIntentLength]),
          intentInput,
        );
        return false;
      }
      clearValidationError(form, error);
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
      translate('countdownDecisionHeading'),
    );
    title.id = 'olv-dialog-title';
    const prompt = createElement(
      this.document,
      'p',
      undefined,
      translate('countdownPrompt'),
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
        translate('secondsRemaining', [Math.ceil(remainingMs / 1_000)]),
      );
    });
  }

  private async askForChallenge(
    mounted: MountedOverlay,
    challenge: string,
    signal: AbortSignal,
  ): Promise<void> {
    const form = createElement(this.document, 'form');
    form.noValidate = true;
    const title = createElement(
      this.document,
      'h1',
      undefined,
      translate('challengeHeading'),
    );
    title.id = 'olv-dialog-title';
    const code = createElement(this.document, 'p', 'challenge-code', challenge);
    const label = createElement(
      this.document,
      'label',
      'text-label',
      translate('challengeInputLabel'),
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
    input.addEventListener('input', () => {
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      const normalizedValue = input.value.toUpperCase();
      if (normalizedValue === input.value) {
        return;
      }
      input.value = normalizedValue;
      input.setSelectionRange(selectionStart, selectionEnd);
    });
    const error = createElement(this.document, 'p', 'error');
    error.id = 'olv-validation-error';
    error.setAttribute('role', 'status');
    error.setAttribute('aria-live', 'polite');
    error.setAttribute('aria-atomic', 'true');
    const actions = createElement(this.document, 'div', 'actions');
    const submit = createElement(
      this.document,
      'button',
      'primary',
      translate('continueButton'),
    );
    submit.type = 'submit';
    actions.append(submit);
    form.append(title, code, label, input, error, actions);
    mounted.content.replaceChildren(form);
    input.focus();

    await waitForValidatedSubmit(form, signal, () => {
      const normalizedValue = input.value.toUpperCase();
      if (normalizedValue !== challenge.toUpperCase()) {
        showValidationError(form, error, translate('challengeMismatch'), input);
        input.select();
        return false;
      }
      input.value = normalizedValue;
      clearValidationError(form, error);
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
      translate('decisionHeading'),
    );
    title.id = 'olv-dialog-title';
    const copy = createElement(
      this.document,
      'p',
      'decision-copy',
      translate('decisionCopy'),
    );
    const abortButton = createElement(
      this.document,
      'button',
      'back-button',
      translate('backButton'),
    );
    abortButton.type = 'button';
    const grid = createElement(this.document, 'div', 'continue-grid');
    const approveButton = createElement(
      this.document,
      'button',
      `primary continue-button position-${plan.continueButtonPosition}`,
      translate('watchHoldButton'),
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
