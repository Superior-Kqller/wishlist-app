"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import {
  Bell,
  ChevronRight,
  Languages,
  LayoutGrid,
  LogOut,
  Palette,
  Send,
  Settings,
  Shield,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-provider";
import { useI18n } from "@/components/i18n/language-provider";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { uiLayout, uiState } from "@/lib/ui-contract";
import { cn, fetcher } from "@/lib/utils";

type MeResponse = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  role: "ADMIN" | "USER";
  telegramLinkStatus?: "linked" | "pending" | "not_configured";
  calendarNotificationsEnabled?: boolean;
};

const surfaceClass = "overflow-hidden rounded-xl border border-border bg-card";
/** Строки группы разделены линией; у одиночной карточки профиля разделителей нет. */
const groupClass = cn(surfaceClass, "divide-y divide-border");

const rowClass = cn(
  "flex min-h-14 w-full items-center gap-3.5 px-3.5 text-left text-[15px] font-medium transition-colors hover:bg-[hsl(var(--surface-3)/0.45)]",
  uiState.focusRing,
);

function RowIcon({
  icon: Icon,
  danger,
}: {
  icon: ComponentType<{ className?: string }>;
  danger?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--surface-3))]",
        danger ? "text-destructive" : "text-foreground",
      )}
      aria-hidden
    >
      <Icon className="size-[1.125rem]" />
    </span>
  );
}

function LinkRow({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: ReactNode;
}) {
  return (
    <Link href={href} className={rowClass}>
      <RowIcon icon={icon} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {value ? <span className="shrink-0 text-sm text-muted-foreground">{value}</span> : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/**
 * «Ещё» — экран, а не выпадающее меню в нижней панели.
 *
 * Под «Ещё» раньше открывался список из двух пунктов, а язык и выход жили в
 * верхней полосе отдельными значками. Теперь всё, что не раздел, собрано
 * здесь: кто вы, как до вас доходят напоминания, язык, администрирование и
 * выход. Состояние Telegram и напоминаний видно сразу, без захода в настройки.
 */
export default function MorePage() {
  const { t } = useI18n();
  const { status } = useSession();
  const { data: me } = useSWR<MeResponse>(
    status === "authenticated" ? "/api/users/me" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const telegramValue =
    me?.telegramLinkStatus === "linked"
      ? t("Подключено")
      : me?.telegramLinkStatus === "pending"
        ? t("Ожидает подтверждения")
        : me
          ? t("Не настроено")
          : null;
  const remindersValue = me
    ? me.calendarNotificationsEnabled
      ? t("Включены")
      : t("Выключены")
    : null;

  return (
    <PageShell>
      <PageMain>
        {/* Хаб телефонного меню: на десктопе те же пункты есть в сайдбаре, а
            во всю рамку строки тянулись на 1170px. Колонка чтения. */}
        <div className={cn(uiLayout.pageStack, "max-w-2xl")}>
          <PageIntro title={t("Ещё")} />

          <Link
            href="/settings"
            className={cn(surfaceClass, "flex items-center gap-3.5 p-3.5", uiState.focusRing)}
          >
            {me ? (
              <UserAvatar avatarUrl={me.avatarUrl} name={me.name} userId={me.id} size="xl" />
            ) : (
              <span className="size-12 shrink-0 rounded-full bg-[hsl(var(--surface-3))]" />
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[17px] font-semibold">{me?.name ?? " "}</span>
              <span className="truncate text-sm text-muted-foreground">
                {me
                  ? `@${me.username} · ${me.role === "ADMIN" ? t("Администратор") : t("Пользователь")}`
                  : " "}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>

          <div className={groupClass}>
            <LinkRow href="/lists" icon={LayoutGrid} label={t("Подборки")} />
          </div>

          <nav aria-label={t("Настройки")} className={groupClass}>
            <LinkRow href="/settings" icon={Settings} label={t("Настройки")} />
            <LinkRow href="/settings" icon={Send} label="Telegram" value={telegramValue} />
            <LinkRow href="/settings" icon={Bell} label={t("Напоминания")} value={remindersValue} />
            {me?.role === "ADMIN" ? (
              <LinkRow href="/admin" icon={Shield} label={t("Администрирование")} />
            ) : null}
          </nav>

          <div className={groupClass}>
            <div className="flex min-h-14 items-center gap-3.5 px-3.5">
              <RowIcon icon={Languages} />
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{t("Язык")}</span>
              <LanguageSwitcher className="h-11 px-3" />
            </div>
            <div className="flex min-h-14 items-center gap-3.5 border-t border-border px-3.5">
              <RowIcon icon={Palette} />
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{t("Тема")}</span>
              <ThemeSwitcher className="h-11 px-3" />
            </div>
          </div>

          <div className={groupClass}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(rowClass, "text-destructive")}
            >
              <RowIcon icon={LogOut} danger />
              <span className="min-w-0 flex-1 truncate">{t("Выйти")}</span>
            </button>
          </div>
        </div>
      </PageMain>
    </PageShell>
  );
}
