"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Pencil } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { PreferenceColorDot } from "@/components/preferences/preference-color-dot";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { getWishWord } from "@/lib/i18n";
import { duration, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { getPreferenceHighlights } from "@/lib/preference-profiles";
import { type GiftPreferences } from "@/lib/preferences";

type PreferenceProfileCardProps = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  preferences?: GiftPreferences | null;
  wishCount?: number;
  isCurrent?: boolean;
  expanded: boolean;
  editing?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  /** Подпись кнопки редактирования: меняется, если остался незаконченный черновик. */
  editLabel?: string;
  children?: ReactNode;
};

export function PreferenceProfileCard({
  id,
  name,
  username,
  avatarUrl,
  preferences,
  wishCount,
  isCurrent = false,
  expanded,
  editing = false,
  onToggle,
  onEdit,
  editLabel,
  children,
}: PreferenceProfileCardProps) {
  const { t, language } = useI18n();
  const reduceMotion = useReducedMotion();
  // Обе кнопки управляют одной областью, значит объявляют одно и то же
  // состояние и указывают на один и тот же регион: раньше aria-expanded был
  // только у имени, и озвучка зависела от того, куда попал фокус.
  const panelId = `preference-profile-panel-${id}`;
  // Кнопка раскрытия повторяется в каждой карточке круга, поэтому её имя
  // называет человека: «Открыть профиль» тридцать раз подряд не помогает
  // выбрать нужную строку в списке элементов скринридера.
  const toggleLabel = `${expanded ? t("Свернуть профиль") : t("Открыть профиль")}: ${name}`;

  /*
   * Свёрнутая карточка раньше показывала пять чисел и одну строку смысла:
   * крупный счётчик «подсказок для подарка», оценочную фразу под ним и
   * три счётчика разделов. Это метрика откровенности анкеты, выставленная
   * на общий обзор родне, — и ни одно из чисел не помогает выбрать подарок.
   * Теперь на её месте стоит то, ради чего профиль открывают: что человеку
   * подойдёт и чего дарить нельзя.
   */
  const highlights = getPreferenceHighlights(preferences);
  const hasHighlights =
    highlights.likes.length > 0 || highlights.colors.length > 0 || highlights.avoid.length > 0;

  return (
    /*
     * Раскрытие — одно движение, а не два несогласованных.
     *
     * Здесь стояла пружина (stiffness 120 / damping 22): коробка росла ~600ms
     * с ползущим хвостом, тогда как содержимое внутри проявлялось за 164ms.
     * Текст можно было читать, пока строки под ним ещё разъезжались. К тому же
     * пружина здесь противоречила контракту: единственный пружинный момент
     * продукта — подтверждение покупки.
     *
     * Теперь высота идёт по той же кривой и той же длительности, что и
     * появление содержимого: `--dur-slow` и `expo`. Конец детерминирован,
     * хвоста нет.
     *
     * `layout` тоже движение — оно так же обязано слушать системную настройку.
     */
    <motion.article
      /*
       * Высотой распоряжается карточка. Панель ниже уходит из потока сразу
       * (`mode="popLayout"`), поэтому высота падает до свёрнутой на первом же
       * кадре, а `layout` доводит её плавно.
       *
       * Без этого закрытие давало скачок: свёрнутая сводка монтируется
       * мгновенно (`{!expanded ? …}`), пока уходящая панель ещё занимает
       * место, — две высоты складывались, карточка вырастала со 183 до 236px
       * и лишь потом падала.
       */
      transition={{ duration: duration.slow, ease: easing.expo }}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-[hsl(var(--surface-2))] shadow-none",
        isCurrent ? "border-primary-accent/45" : "border-border/55",
        expanded && "border-primary-accent/55",
      )}
    >
      <div className="overflow-hidden p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <UserAvatar
              avatarUrl={avatarUrl}
              name={name}
              userId={id}
              size="xl"
              className="ring-2 ring-background ring-offset-1 ring-offset-border/45"
            />
          </div>

          {/* Кнопка держит только имя: раньше в неё были вложены заголовок,
              строка счётчика и обёртки, а скринридеры схлопывают содержимое
              кнопки в её имя — заголовок переставал быть заголовком, а имя
              кнопки превращалось в «Avgel Это вы @Avgel · 5 желаний». */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Обрезает заголовок, а не кнопка внутри него: блочная кнопка
                  с `max-w-full` брала ширину у родителя, ширина родителя
                  считалась по обрезаемому содержимому — и имя схлопывалось
                  в «us…» посреди пустой строки. Кнопка теперь строчная и
                  меряется текстом, а `truncate` живёт на заголовке.

                  Отсюда же её высота — по строке, около 24px. Расширить цель
                  вертикальным отступом нельзя: `truncate` на заголовке несёт
                  `overflow: hidden`, и отступ строчной кнопки был бы срезан
                  вместе с попаданием по нему. Порог здесь держит соседний
                  шеврон 44×44 — он делает ровно то же самое и стоит в двух
                  сантиметрах, поэтому имя остаётся дополнительным способом
                  раскрыть карточку, а не единственным. */}
              <h2 className="min-w-0 max-w-full truncate text-base font-semibold sm:text-lg">
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  className="rounded-lg text-left active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {name}
                </button>
              </h2>
              {isCurrent ? (
                <span className="rounded-full border border-primary-accent/32 bg-primary-accent/10 px-2 py-0.5 text-[11px] font-medium text-primary-accent">
                  {t("Это вы")}
                </span>
              ) : null}
              {/* Незаконченный черновик виден на любом экране: подпись кнопки
                  правки ниже `sm` скрыта, и на телефоне — там, где анкету
                  бросают на полпути чаще всего — о нём не оставалось следа. */}
              {isCurrent && editLabel ? (
                /* Текст полным контрастом, а не краской статуса: `text-warning`
                   на 11 пикселях давал в светлой теме 4.46 при пороге 4.5, и
                   единственный след брошенной работы оказывался самым бледным
                   элементом карточки. Смысл несёт само слово, а краска
                   осталась в рамке и заливке. */
                <span className="rounded-full border border-warning/45 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {t("Черновик")}
                </span>
              ) : null}
            </div>
            {/* Число желаний — единственный счётчик, который остался: он говорит,
                есть ли вообще куда идти дальше. Место ему в подписи, не в теле,
                и формулировка короткая — иначе строка обрезается рядом с кнопкой. */}
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              @{username}
              {typeof wishCount === "number"
                ? ` · ${wishCount} ${getWishWord(language, wishCount)}`
                : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isCurrent && onEdit ? (
              <Button
                type="button"
                size="sm"
                variant={editing ? "default" : "outline"}
                /* Ниже `sm` подпись скрыта и остаётся одна иконка: без
                   `min-w-11` цель выходила 38px по ширине при 44 по высоте. */
                className="min-w-11 gap-1.5 sm:min-w-0"
                onClick={onEdit}
                aria-label={editLabel ?? t("Настроить")}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{t("Настроить")}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={toggleLabel}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-base",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </Button>
          </div>
        </div>

        {/* Превью — форма для свёрнутой карточки. Держать его и в раскрытом
            виде было лечением не в том месте: значения превью — строгое
            подмножество значений сводки, и человек читал одно и то же дважды
            через шестнадцать пикселей. Главный сигнал не понижается теперь
            иначе — стоп-лист внутри сводки красится сам (`PreferenceSignalRow`,
            `getValueColor`), а не отличается краской иконки в 14px. */}
        {!expanded ? (
          <div className="mt-4 space-y-2 border-t border-border/45 pt-4 text-sm">
            {hasHighlights ? (
              <>
                {/* Обычный inline-поток, а не flex: подпись и значения переносятся
                    как одно предложение, а кружки цветов встают следом за
                    последним словом, а не отдельной висящей строкой. */}
                {highlights.likes.length > 0 || highlights.colors.length > 0 ? (
                  <p className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
                    <span className="text-muted-foreground">
                      {highlights.likes.length > 0 ? t("Подойдёт") : t("Любимые цвета")}:{" "}
                    </span>
                    <span className="text-foreground/85">
                      {highlights.likes.map((value) => t(value)).join(", ")}
                    </span>
                    {highlights.likesHidden > 0 ? (
                      <span className="text-muted-foreground"> +{highlights.likesHidden}</span>
                    ) : null}
                    {highlights.colors.length > 0 ? (
                      /* `role="img"` обязателен: на обычном `span` метку
                         игнорирует большинство скринридеров, и любимые цвета
                         для незрячего читателя просто не существовали. */
                      <span
                        role="img"
                        className={cn(
                          "inline-flex -space-x-1.5 align-text-bottom",
                          highlights.likes.length > 0 && "ml-2",
                        )}
                        aria-label={`${t("Любимые цвета")}: ${highlights.colors
                          .map((color) => t(color))
                          .join(", ")}`}
                      >
                        {highlights.colors.map((color) => (
                          <PreferenceColorDot
                            key={color}
                            value={color}
                            size="lg"
                            inset
                            title={t(color)}
                          />
                        ))}
                      </span>
                    ) : null}
                  </p>
                ) : null}

                {highlights.avoid.length > 0 ? (
                  <p className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
                    <span className="text-muted-foreground">{t("Не дарить")}: </span>
                    <span className="font-medium text-destructive">
                      {highlights.avoid.map((value) => t(value)).join(", ")}
                    </span>
                    {highlights.avoidHidden > 0 ? (
                      <span className="text-muted-foreground"> +{highlights.avoidHidden}</span>
                    ) : null}
                  </p>
                ) : null}
              </>
            ) : (
              /* Пустой профиль чужого человека — просто факт, а не упрёк:
                 фраза «Профиль ждёт первых подсказок» оценивала того, кто
                 ничего не обещал заполнять. */
              <p className="text-muted-foreground">
                {isCurrent
                  ? t("Расскажите о себе — друзьям будет проще выбрать подарок.")
                  : t("Подсказок пока нет.")}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Область живёт в разметке всегда, даже пустой: раньше `id` появлялся
          вместе с содержимым, и в свёрнутом состоянии обе кнопки ссылались
          через `aria-controls` на несуществующий элемент.
          `@container` объявлен на том же элементе, что несёт padding: когда он
          стоял на внешней обёртке, порог `@[32rem]` срабатывал при контейнере
          512px, тогда как контента внутри было 472px — систематическая ошибка
          в 40px во всех четырёх порогах сводки. */}
      <div id={panelId}>
        <AnimatePresence initial={false} mode="popLayout">
          {expanded ? (
            <motion.div
              key={editing ? "editor" : "summary"}
              /*
               * Панель проявляется прозрачностью; место под неё освобождает сама
               * карточка. Сдвиг
               * `y: -10` рассказывал вторую историю: содержимое ехало сверху
               * вниз, пока коробка росла сверху вниз же. Теперь движение одно —
               * освобождается место, и в нём проявляется содержимое.
               */
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              // Уход быстрее прихода: панель гаснет, пока карточка смыкается.
              exit={{ opacity: 0, transition: { duration: duration.fast, ease: easing.expo } }}
              transition={{ duration: duration.slow, ease: easing.expo }}
              className="overflow-hidden"
            >
              {/* `@container` объявлен на том же элементе, что несёт padding:
                  пороги сводки считаются по ширине контента, а не обёртки. */}
              <div className="@container border-t border-border/45 px-4 py-4 sm:px-5 sm:py-5">
                {children}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
