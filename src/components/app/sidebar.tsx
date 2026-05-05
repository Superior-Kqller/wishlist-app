"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Download,
  Heart,
  Home,
  ListChecks,
  LogOut,
  Plus,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useHeaderActions } from "@/lib/header-actions";
import { uiState, uiSurface } from "@/lib/ui-contract";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const {
    actions: { onAddItem },
  } = useHeaderActions();

  if (!session?.user || pathname === "/login") return null;

  const navItems: NavItem[] = [
    { label: "Главная", href: "/", icon: Home },
    { label: "Все списки", icon: ListChecks, disabled: true },
    { label: "Совместные", icon: Users, disabled: true },
    { label: "Избранное", icon: Heart, disabled: true },
    { label: "Уведомления", icon: Bell, disabled: true },
    { label: "Настройки", href: "/settings", icon: Settings },
  ];

  if (session.user.role === "ADMIN") {
    navItems.push({ label: "Админка", href: "/admin", icon: Shield });
  }

  const isMainPage = pathname === "/";

  const handleExport = async (format: "csv" | "json") => {
    const res = await fetch(`/api/items/export?format=${format}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
      `wishlist.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddItem = () => {
    if (!isMainPage) {
      router.push("/?add=1");
      return;
    }
    onAddItem?.();
  };

  const handleSignOut = () => {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-[17.5rem] shrink-0 flex-col px-4 py-5 lg:flex",
        uiSurface.sidebar,
      )}
      aria-label="Основная навигация"
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mb-7 rounded-xl text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Вишлист — на главную"
      >
        <BrandLockup />
      </button>

      <div className="mb-5 flex flex-col gap-2">
        <Button type="button" className="h-10 justify-start gap-2" onClick={handleAddItem}>
          <Plus className="h-4 w-4" />
          Добавить товар
        </Button>
        {isMainPage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-10 justify-start gap-2">
                <Download className="h-4 w-4" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Экспорт CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Экспорт JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;

          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              className={cn(
                "h-11 justify-start gap-3 rounded-lg px-3",
                uiState.navBase,
                active && uiState.navActive,
                item.disabled && "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-muted-foreground",
              )}
              disabled={item.disabled}
              aria-current={active ? "page" : undefined}
              title={item.disabled ? "Будет подключено в следующих этапах" : item.label}
              onClick={() => {
                if (item.href) router.push(item.href);
              }}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="rounded-xl border border-border bg-[hsl(var(--surface-3))/0.7] px-3 py-3">
        <p className="truncate text-sm font-semibold text-foreground">
          {session.user.name ?? "Пользователь"}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {session.user.email ?? session.user.username ?? "Аккаунт"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 h-8 w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    </aside>
  );
}
