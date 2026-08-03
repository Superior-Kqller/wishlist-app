import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` на клиенте и `useEffect` на сервере.
 *
 * Нужен там, где решение зависит от размеров окна и должно приниматься до
 * отрисовки кадра: обычный эффект даёт видимую подмену уже нарисованного
 * содержимого. На сервере `useLayoutEffect` бессмыслен и предупреждает.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
