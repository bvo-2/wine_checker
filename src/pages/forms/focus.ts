/** Moves focus to the first field in error, so keyboard and screen-reader users land on it. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  const first = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!first) return;
  const target =
    first.getAttribute('role') === 'radiogroup'
      ? (first.querySelector<HTMLElement>('input:checked') ??
        first.querySelector<HTMLElement>('input'))
      : first;
  target?.focus();
  target?.scrollIntoView?.({ block: 'center' });
}
