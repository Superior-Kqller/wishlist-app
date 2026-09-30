import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn("min-h-full page-bg", className)}>{children}</div>;
}

interface PageMainProps {
  children: ReactNode;
  className?: string;
}

/**
 * Единая рамка контента для всех разделов.
 *
 * Ширина и горизонтальные отступы заданы здесь и только здесь: раньше каждая
 * страница выбирала свои (`max-w-5xl`, `max-w-6xl`, полная ширина), из-за чего
 * заголовки разделов не совпадали по вертикали при переходах. Страницам,
 * которым нужна узкая колонка чтения, следует сузить собственный контент,
 * а не рамку.
 *
 * Ширина совпадает с верхней панелью (DESIGN.md → «Раскладка»: до 1280px по
 * центру), поэтому край заголовка стоит под знаком в шапке.
 *
 * Элемент намеренно `div`: `<main>` уже объявлен в оболочке приложения.
 */
export function PageMain({ children, className }: PageMainProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[80rem] px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-8 xl:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageIntroProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Заголовок страницы. Это единственный крупный типографический шаг в
 * продукте, поэтому он не панель и не карточка: тонкая линия снизу отделяет
 * его от контента дешевле, чем рамка, и не создаёт вложенных поверхностей.
 *
 * На телефоне шапка ужимается: подзаголовок — ориентирующая строка для
 * первого знакомства, и на узком экране он оттеснял сам контент раздела
 * почти на треть экрана. Ниже `sm` он остаётся в разметке для скринридеров
 * (`sr-only`), но не занимает места, а вертикальные отступы сокращаются.
 */
export function PageIntro({ title, description, actions, className }: PageIntroProps) {
  return (
    /*
     * Шапка не анимируется при появлении. Раньше она проигрывала `rise-in` —
     * 620ms со сдвигом и размытием — при каждом переходе между разделами, то
     * есть заставляла ждать хореографию загрузки на каждом маршруте. Для
     * рабочего интерфейса это плата без выгоды: содержимое уже готово, а
     * читать его нельзя ещё полсекунды.
     */
    <div className={cn("relative mb-6 sm:mb-8", className)}>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="page-title text-foreground">{title}</h1>
          {description ? <p className="page-lede max-sm:sr-only sm:mt-1">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0 sm:pb-1">{actions}</div> : null}
      </div>
    </div>
  );
}
