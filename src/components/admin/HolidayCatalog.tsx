"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetcher } from "@/lib/fetcher";
import type { HolidayCatalogEntry } from "@/lib/calendar/holiday-catalog";
import type { HolidayRule } from "@/lib/calendar/holiday-rules";

function changeFixedRule(rule: HolidayRule, field: "day" | "month", value: number): HolidayRule {
  if (rule.kind !== "FIXED") return rule;
  return { ...rule, [field]: value };
}

function changeRelativeRule(
  rule: HolidayRule,
  field: "month" | "weekday" | "occurrence",
  value: number,
): HolidayRule {
  if (rule.kind !== "NTH_WEEKDAY") return rule;
  return { ...rule, [field]: value };
}

export function HolidayCatalog() {
  const { data, mutate, isLoading } = useSWR<{ holidays: HolidayCatalogEntry[] }>(
    "/api/admin/holidays",
    fetcher,
  );
  const [name, setName] = useState("");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  async function create() {
    const response = await fetch("/api/admin/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        rule: { kind: "FIXED", month, day },
        enabled: true,
        remindersEnabled: true,
        theme: null,
      }),
    });
    if (!response.ok) return toast.error("Не удалось добавить праздник");
    setName("");
    await mutate();
  }

  async function patch(id: string, input: Partial<HolidayCatalogEntry>) {
    const response = await fetch(`/api/admin/holidays/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return toast.error("Не удалось изменить праздник");
    await mutate();
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="section-title">Общие праздники</h2>
        <p className="text-sm text-muted-foreground">
          Локальный каталог для всех пользователей установки
        </p>
      </div>
      <div className="grid gap-2 rounded-xl border p-4 sm:grid-cols-[1fr_6rem_6rem_auto]">
        <Input
          aria-label="Название нового праздника"
          placeholder="Название праздника"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          aria-label="Месяц"
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        />
        <Input
          aria-label="День"
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(event) => setDay(Number(event.target.value))}
        />
        <Button onClick={create} disabled={!name.trim()}>
          Добавить
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {(data?.holidays ?? []).map((holiday) => (
            <div key={holiday.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div>
                <Input
                  aria-label={`Название: ${holiday.name}`}
                  defaultValue={holiday.name}
                  onBlur={(event) => {
                    const nextName = event.target.value.trim();
                    if (nextName && nextName !== holiday.name) {
                      void patch(holiday.id, { name: nextName });
                    }
                  }}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Select
                    value={holiday.rule.kind}
                    onValueChange={(value) =>
                      void patch(holiday.id, {
                        rule:
                          value === "FIXED"
                            ? { kind: "FIXED", month: 1, day: 1 }
                            : {
                                kind: "NTH_WEEKDAY",
                                month: 1,
                                weekday: 0,
                                occurrence: 1,
                              },
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label={`Тип правила: ${holiday.name}`}
                      className="h-9 w-auto"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Фиксированная дата</SelectItem>
                      <SelectItem value="NTH_WEEKDAY">N-й день недели</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={holiday.theme ?? "none"}
                    onValueChange={(value) =>
                      void patch(holiday.id, {
                        theme: value === "none" ? null : (value as "MALE" | "FEMALE"),
                      })
                    }
                  >
                    <SelectTrigger aria-label={`Тематика: ${holiday.name}`} className="h-9 w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без тематики</SelectItem>
                      <SelectItem value="MALE">Мужская</SelectItem>
                      <SelectItem value="FEMALE">Женская</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {holiday.rule.kind === "FIXED" ? (
                  <div className="mt-2 flex gap-2">
                    <Input
                      aria-label={`День: ${holiday.name}`}
                      className="w-20"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={holiday.rule.day}
                      onBlur={(event) =>
                        void patch(holiday.id, {
                          rule: changeFixedRule(holiday.rule, "day", Number(event.target.value)),
                        })
                      }
                    />
                    <Input
                      aria-label={`Месяц: ${holiday.name}`}
                      className="w-20"
                      type="number"
                      min={1}
                      max={12}
                      defaultValue={holiday.rule.month}
                      onBlur={(event) =>
                        void patch(holiday.id, {
                          rule: changeFixedRule(holiday.rule, "month", Number(event.target.value)),
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Input
                      aria-label={`Номер дня недели: ${holiday.name}`}
                      className="w-24"
                      type="number"
                      min={0}
                      max={6}
                      defaultValue={holiday.rule.weekday}
                      onBlur={(event) =>
                        void patch(holiday.id, {
                          rule: changeRelativeRule(
                            holiday.rule,
                            "weekday",
                            Number(event.target.value),
                          ),
                        })
                      }
                    />
                    <Input
                      aria-label={`Порядок недели: ${holiday.name}`}
                      className="w-24"
                      type="number"
                      min={-5}
                      max={5}
                      defaultValue={holiday.rule.occurrence}
                      onBlur={(event) =>
                        void patch(holiday.id, {
                          rule: changeRelativeRule(
                            holiday.rule,
                            "occurrence",
                            Number(event.target.value),
                          ),
                        })
                      }
                    />
                    <Input
                      aria-label={`Месяц: ${holiday.name}`}
                      className="w-20"
                      type="number"
                      min={1}
                      max={12}
                      defaultValue={holiday.rule.month}
                      onBlur={(event) =>
                        void patch(holiday.id, {
                          rule: changeRelativeRule(
                            holiday.rule,
                            "month",
                            Number(event.target.value),
                          ),
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                <Switch
                  checked={holiday.enabled}
                  onChange={(event) => void patch(holiday.id, { enabled: event.target.checked })}
                />
                Включён
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                <Switch
                  checked={holiday.remindersEnabled}
                  onChange={(event) =>
                    void patch(holiday.id, {
                      remindersEnabled: event.target.checked,
                    })
                  }
                />
                Напоминания
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
