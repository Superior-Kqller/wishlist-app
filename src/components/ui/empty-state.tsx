import * as React from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";

interface EmptyStateProps extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryIcon?: React.ReactNode;
}

function revealDelay(ms: number) {
  return { "--reveal-delay": `${ms}ms` } as React.CSSProperties;
}

/**
 * Пустое состояние — не заглушка, а первый экран раздела: чаще всего человек
 * видит его раньше, чем заполненный список. Поэтому у него есть собственный
 * свет — мягкое пятно за иконкой в цвете темы — и содержимое проявляется
 * по очереди, а не всё разом.
 */
function EmptyState({
  className,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  secondaryIcon,
  ...props
}: EmptyStateProps) {
  const hasActions = Boolean((actionLabel && onAction) || (secondaryLabel && onSecondaryAction));
  const headingId = React.useId();

  return (
    // Раньше здесь стояли role="status" + aria-live: live-region поглощала
    // заголовок, и раздел выпадал из карты документа. Это не транзиентный
    // статус, а полноценный первый экран раздела — значит, обычный регион
    // с заголовком, по которому можно навигировать.
    <section
      aria-labelledby={headingId}
      className={cn(
        "relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden sm:min-h-[340px]",
        uiSurface.emptyState,
        className,
      )}
      {...props}
    >
      <div
        data-reveal=""
        className="relative mb-4 flex size-12 items-center justify-center text-muted-foreground [&_svg]:size-8 [&_svg]:stroke-[1.5]"
      >
        {icon ?? <Inbox aria-hidden />}
      </div>

      <h2
        id={headingId}
        data-reveal=""
        style={revealDelay(60)}
        // Пустое состояние — первый экран раздела, а не заглушка (см. комментарий
        // выше), поэтому заголовок здесь звучит тем же голосом, что заголовок
        // страницы, и на шаг крупнее прежнего `text-lg`.
        className="relative max-w-[28ch] text-base font-semibold"
      >
        {title}
      </h2>

      {description ? (
        <p
          data-reveal=""
          style={revealDelay(110)}
          className="relative mt-2 max-w-[46ch] text-pretty text-sm leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
      ) : null}

      {hasActions ? (
        <div
          data-reveal=""
          style={revealDelay(170)}
          className="relative mt-6 flex flex-col gap-2 sm:flex-row"
        >
          {actionLabel && onAction ? (
            <Button type="button" size="lg" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {secondaryLabel && onSecondaryAction ? (
            <Button type="button" size="lg" variant="outline" onClick={onSecondaryAction}>
              {secondaryIcon}
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export { EmptyState };
