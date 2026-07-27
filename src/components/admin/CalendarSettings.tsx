"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";

const COMMON_TIME_ZONES = [
  "Europe/Moscow",
  "Europe/Berlin",
  "Europe/London",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Asia/Yerevan",
  "America/New_York",
];

export function CalendarSettings() {
  const { data, mutate, isLoading } = useSWR<{ timeZone: string }>(
    "/api/admin/calendar-settings",
    fetcher,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? data?.timeZone ?? "";

  async function save() {
    const response = await fetch("/api/admin/calendar-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone: value }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Не удалось сохранить временную зону");
      return;
    }
    setDraft(null);
    await mutate();
    toast.success("Временная зона сохранена");
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Напоминания календаря</h2>
        <p className="text-sm text-muted-foreground">
          Обработка запускается автоматически около 10:00 по времени установки
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 space-y-2 text-sm font-medium">
          Временная зона установки
          <Input
            list="calendar-time-zones"
            value={value}
            disabled={isLoading}
            placeholder="Europe/Moscow"
            onChange={(event) => setDraft(event.target.value)}
          />
          <datalist id="calendar-time-zones">
            {COMMON_TIME_ZONES.map((timeZone) => (
              <option key={timeZone} value={timeZone} />
            ))}
          </datalist>
        </label>
        <Button onClick={save} disabled={isLoading || !value || value === data?.timeZone}>
          Сохранить
        </Button>
      </div>
    </section>
  );
}
