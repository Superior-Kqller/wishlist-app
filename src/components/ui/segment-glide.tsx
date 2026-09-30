"use client";

import { useLayoutEffect, useRef } from "react";

const ACTIVE = '[data-state="active"],[aria-pressed="true"],[aria-checked="true"]';

/**
 * Tab Pill Glide (kinetics.colorion.co): одна пилюля выбора переезжает между
 * сегментами — 0.4s, цель меряется по активному элементу.
 *
 * Кладётся первым ребёнком «рельсы» (`uiLayout.segmentBar*`, `relative isolate`):
 * пилюля на `-z-10` встаёт над фоном рельсы, но под всеми сегментами. Пока пилюля не
 * встала, выбранный сегмент закрашен сам; после — рельса получает
 * `data-glide="ready"`, и заливку отдаёт пилюле (`uiState.segmentActive`).
 * При `prefers-reduced-motion` глобальное правило снимает переход по размерам.
 */
export function SegmentGlide() {
  const pillRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    const rail = pill?.parentElement;
    if (!pill || !rail) return;

    const place = () => {
      const target = rail.querySelector<HTMLElement>(ACTIVE);
      if (!target) {
        pill.style.opacity = "0";
        return;
      }
      // Положение — через transform (HeroUI → Animation → Performance), не left/top.
      pill.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
      pill.style.width = `${target.offsetWidth}px`;
      pill.style.height = `${target.offsetHeight}px`;
      pill.style.opacity = "1";
      rail.dataset.glide = "ready";
    };

    // Первая расстановка — без перехода: пилюля не «вырастает» из нуля при загрузке.
    pill.style.transition = "none";
    place();
    void pill.offsetWidth;
    pill.style.transition = "";
    const mutations = new MutationObserver(place);
    mutations.observe(rail, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-pressed", "aria-checked"],
    });
    const resize = new ResizeObserver(place);
    resize.observe(rail);
    return () => {
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <span
      ref={pillRef}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 -z-10 rounded-full bg-foreground opacity-0 transition-[transform,width,height,opacity] duration-[400ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
    />
  );
}
