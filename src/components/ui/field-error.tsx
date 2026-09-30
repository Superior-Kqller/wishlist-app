/**
 * Текст ошибки под полем. Поле ссылается на него через `aria-describedby` и
 * ставит `aria-invalid` — рамка краснеет сама (`uiState.focusField`). Раньше
 * ошибка жила только во всплывающем уведомлении: оно исчезало, а поле так и не
 * говорило, что с ним не так (WCAG 3.3.1).
 */
export function FieldError({ id, children }: { id: string; children?: string | null }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {children}
    </p>
  );
}
