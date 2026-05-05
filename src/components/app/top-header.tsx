"use client";

import { FormEvent, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHeaderActions } from "@/lib/header-actions";
import { uiSurface } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";

export function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const {
    actions: { onAddItem },
  } = useHeaderActions();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  if (!session?.user || pathname === "/login") return null;

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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set("search", trimmed);
    else params.delete("search");
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  };

  const handleSignOut = () => {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden min-h-[72px] items-center gap-4 px-6 lg:flex",
        uiSurface.topHeader,
      )}
    >
      <form className="min-w-0 flex-1" role="search" onSubmit={handleSearchSubmit}>
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder="Поиск по спискам и товарам..."
          wrapperClassName="max-w-[34rem]"
          inputClassName="h-10 bg-[hsl(var(--surface-3))/0.82]"
        />
      </form>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (!isMainPage) {
              router.push("/?add=1");
              return;
            }
            onAddItem?.();
          }}
          className="min-w-[148px]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>

        {isMainPage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Экспорт"
                aria-label="Экспорт"
              >
                <Download className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Экспорт CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Экспорт JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Выйти"
          aria-label="Выйти"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
