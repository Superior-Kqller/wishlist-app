"use client";

import { useEffect, type MutableRefObject } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { CreateItemPayload } from "@/types";

type DeepLinkBox = {
  addUrl: string | null;
  fill: boolean;
  consumed: boolean;
};

type RouterReplace = (href: string, options?: { scroll?: boolean }) => void;

export function useWishlistAddUrlDeepLink(
  deepLinkRef: MutableRefObject<DeepLinkBox | null>,
  currentUserId: string | undefined,
  routerReplace: RouterReplace,
  searchParams: ReadonlyURLSearchParams,
  setParsedData: (v: Partial<CreateItemPayload> | null) => void,
  setAddDialogAutoFill: (v: boolean) => void,
  setAddDialogOpen: (v: boolean) => void,
) {
  useEffect(() => {
    if (!currentUserId) return;
    const box = deepLinkRef.current;
    if (!box || box.consumed || !box.addUrl) return;

    const paramsCleanup = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("addUrl");
      params.delete("fill");
      const qs = params.toString();
      routerReplace(qs ? `/?${qs}` : "/", { scroll: false });
    };

    let decoded: string;
    try {
      decoded = decodeURIComponent(box.addUrl);
      if (decoded.length > 2048) throw new Error("too long");
      new URL(decoded);
    } catch {
      toast.error("Некорректная ссылка в параметре addUrl");
      box.consumed = true;
      paramsCleanup();
      return;
    }

    box.consumed = true;
    const wantFill = box.fill;
    paramsCleanup();

    setParsedData({ url: decoded });
    setAddDialogAutoFill(wantFill);
    setAddDialogOpen(true);
    // deepLinkRef — стабильный объект ref; читаем .current при смене URL/сессии
  }, [
    currentUserId,
    routerReplace,
    searchParams,
    setParsedData,
    setAddDialogAutoFill,
    setAddDialogOpen,
    deepLinkRef,
  ]);
}
