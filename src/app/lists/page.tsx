"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { FolderOpen, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RetryNotice } from "@/components/ui/retry-notice";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";
import { getWishWord } from "@/lib/i18n";
import { uiLayout, uiState } from "@/lib/ui-contract";
import { cn, fetcher } from "@/lib/utils";
import type { ListWithMeta, UserWithStats } from "@/types";

const ListFormDialog = dynamic(
  () => import("@/components/ListFormDialog").then((mod) => mod.ListFormDialog),
  { ssr: false },
);

// DESIGN.md → «Адаптив»: 2 в ряд на телефоне, 3 на планшете, 4 на десктопе.
const gridClass = "grid grid-cols-2 gap-4 min-[744px]:grid-cols-3 min-[1128px]:grid-cols-4";

function TileImage({ src, className }: { src: string; className: string }) {
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(min-width: 1128px) 20vw, (min-width: 744px) 30vw, 45vw"
      className={className}
      unoptimized={src.startsWith("/uploads/")}
    />
  );
}

/** Обложка, иначе мозаика из фото желаний, иначе пустая плитка. */
function ListTileMedia({ list }: { list: ListWithMeta }) {
  const photos = list.previewImages ?? [];
  const tile = "relative aspect-square overflow-hidden rounded-[14px]";

  if (list.coverUrl) {
    return (
      <div className={tile}>
        <TileImage src={list.coverUrl} className="object-cover" />
      </div>
    );
  }
  if (photos.length === 1) {
    return (
      <div className={cn(tile, "media-tile")}>
        <TileImage src={photos[0]} className="object-contain p-6" />
      </div>
    );
  }
  if (photos.length > 1) {
    return (
      <div className={cn(tile, "grid grid-cols-2 gap-px bg-border")}>
        {photos.map((src, i) => (
          <div key={`${src}-${i}`} className="media-tile relative">
            <TileImage src={src} className="object-contain p-3" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        tile,
        "flex items-center justify-center bg-[hsl(var(--surface-3))] text-muted-foreground",
      )}
    >
      <FolderOpen className="size-8 stroke-[1.5]" aria-hidden />
    </div>
  );
}

function ListTile({
  list,
  owner,
  onEdit,
}: {
  list: ListWithMeta;
  owner: string | null;
  onEdit?: () => void;
}) {
  const { t, language } = useI18n();
  const count = list._count.items;

  return (
    <div className="group relative">
      <Link href={`/?listId=${list.id}`} className={cn("block rounded-[14px]", uiState.focusRing)}>
        <div className="overflow-hidden rounded-[14px] [&_img]:transition-transform [&_img]:duration-[220ms] group-hover:[&_img]:scale-[1.02] motion-reduce:[&_img]:transition-none">
          <ListTileMedia list={list} />
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="truncate text-base font-semibold">{list.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            <span className="tabular-nums">
              {count} {getWishWord(language, count)}
            </span>
            {owner ? ` · ${owner}` : ""}
          </p>
        </div>
      </Link>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t("Изменить подборку")}: ${list.name}`}
          className={cn(
            "absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-background text-foreground shadow-[var(--shadow-float)]",
            uiState.focusRing,
          )}
        >
          <Pencil className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="section-title">{title}</h2>
      <div className={gridClass}>{children}</div>
    </section>
  );
}

export default function ListsPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [editing, setEditing] = useState<ListWithMeta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: lists,
    error,
    mutate,
  } = useSWR<ListWithMeta[]>("/api/lists", fetcher, { revalidateOnFocus: false });
  const { data: usersData } = useSWR<{ users: UserWithStats[] }>("/api/users/stats", fetcher, {
    revalidateOnFocus: false,
  });
  const users = useMemo(() => usersData?.users ?? [], [usersData?.users]);

  const mine = (lists ?? []).filter((l) => l.userId === currentUserId);
  const shared = (lists ?? []).filter((l) => l.userId !== currentUserId);
  const ownerName = (id: string) => users.find((u) => u.id === id)?.name ?? null;

  const openDialog = (list: ListWithMeta | null) => {
    setEditing(list);
    setDialogOpen(true);
  };

  return (
    <PageShell>
      <PageMain>
        <div className={uiLayout.pageStack}>
          <PageIntro
            title={t("Подборки")}
            actions={
              <Button type="button" onClick={() => openDialog(null)}>
                <Plus className="size-4" aria-hidden />
                {t("Создать подборку")}
              </Button>
            }
          />

          {error ? (
            <RetryNotice onRetry={() => mutate()}>{t("Не удалось загрузить подборки")}</RetryNotice>
          ) : !lists ? (
            <div className={cn(gridClass, "animate-pulse")} aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="aspect-square rounded-[14px] bg-muted" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <EmptyState
              icon={<FolderOpen aria-hidden />}
              title={t("Подборок пока нет")}
              description={t("Создайте первую или дождитесь, пока с вами поделятся.")}
              actionLabel={t("Создать подборку")}
              onAction={() => openDialog(null)}
            />
          ) : (
            <div className="space-y-12">
              {mine.length > 0 ? (
                <Section title={t("Мои подборки")}>
                  {mine.map((l) => (
                    <ListTile key={l.id} list={l} owner={null} onEdit={() => openDialog(l)} />
                  ))}
                </Section>
              ) : null}
              {shared.length > 0 ? (
                <Section title={t("Со мной поделились")}>
                  {shared.map((l) => (
                    <ListTile key={l.id} list={l} owner={ownerName(l.userId)} />
                  ))}
                </Section>
              ) : null}
            </div>
          )}
        </div>
      </PageMain>

      <ListFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        list={editing}
        users={users}
        onSuccess={() => mutate()}
      />
    </PageShell>
  );
}
