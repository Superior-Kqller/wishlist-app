"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/i18n/language-provider";
import { getAvatarColor } from "@/lib/avatar-utils";
import { duration, easing } from "@/lib/motion";
import { getPreferenceColor } from "@/lib/preference-colors";
import { cn } from "@/lib/utils";

function luminance(hex: string) {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

// Подпись на полосе — белая или чернила #222 (яркость 1 и ~0.016), что
// контрастнее. Цвета темы здесь не годятся: полоса — цвет человека, а не
// поверхность, и в светлой теме «светлая» подпись оказалась бы тёмной.
function prefersDarkLabel(hex: string) {
  const l = luminance(hex);
  return (l + 0.05) / (0.016 + 0.05) > (1 + 0.05) / (l + 0.05);
}

/**
 * Палитра человека — его любимые цвета полосами, в порядке, в каком он их
 * назвал. Это единственные насыщенные поля на странице профилей: человек
 * узнаётся по ним раньше, чем по имени.
 *
 * Цвет без известного оттенка не выпадает, а стоит нейтральной полосой со
 * своим названием: иначе палитра молча врала бы о человеке. Без названных
 * цветов вовсе полоса берёт цвет его аватара — знакомый по всему продукту.
 *
 * Раскладка слева направо проигрывается только в сцене и только при смене
 * человека (`animate`): это единственное авторское движение раздела, и оно
 * отвечает на выбор, а не на загрузку страницы.
 */
export function PaletteBand({
  userId,
  colors,
  labelled = false,
  animate = false,
  className,
}: {
  userId: string;
  colors: string[];
  /** Подписи цветов на самих полосах — для сцены, где полоса широкая. */
  labelled?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const swatches = colors.map((name) => ({ name, hex: getPreferenceColor(name) }));

  // Волосяная кромка снизу и между полосами держит форму тёмных образцов
  // («Чёрный», «Графитовый»), которые иначе растворяются в поверхности.
  const edge = "shadow-[inset_0_-1px_0_hsl(var(--foreground)/0.1)]";

  if (swatches.length === 0) {
    return <div aria-hidden className={cn("w-full", getAvatarColor(userId), edge, className)} />;
  }

  return (
    <div
      className={cn("flex w-full", edge, className)}
      role={labelled ? "img" : undefined}
      aria-label={
        labelled ? `${t("Любимые цвета")}: ${swatches.map((s) => t(s.name)).join(", ")}` : undefined
      }
      aria-hidden={labelled ? undefined : true}
    >
      {swatches.map((swatch, index) => (
        <motion.div
          key={`${userId}-${swatch.name}`}
          initial={animate && !reduceMotion ? { scaleX: 0 } : false}
          animate={{ scaleX: 1 }}
          transition={{ duration: duration.base, ease: easing.expo, delay: index * 0.035 }}
          className={cn(
            "relative min-w-0 flex-1 origin-left shadow-[inset_1px_0_0_hsl(var(--foreground)/0.1)] first:shadow-none",
            !swatch.hex && "bg-[hsl(var(--surface-4))]",
          )}
          style={swatch.hex ? { backgroundColor: swatch.hex } : undefined}
        >
          {labelled || !swatch.hex ? (
            <span
              aria-hidden
              className={cn(
                "absolute left-2.5 right-1 top-2 truncate text-xs font-semibold",
                !swatch.hex
                  ? "text-foreground"
                  : prefersDarkLabel(swatch.hex)
                    ? "text-[#222222]"
                    : "text-white",
              )}
            >
              {t(swatch.name)}
            </span>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
