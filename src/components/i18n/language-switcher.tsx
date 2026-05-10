"use client";

import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, languageLabels, languageShortLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useI18n } from "./language-provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-9 gap-2 px-2.5", className)}
          title={t("Сменить язык")}
          aria-label={t("Сменить язык")}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">{languageShortLabels[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t("Язык")}</DropdownMenuLabel>
        {LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => setLanguage(option)}
            className="gap-2"
            aria-label={`${t("Выбранный язык")}: ${languageLabels[option]}`}
          >
            <Check
              className={cn(
                "h-4 w-4",
                option === language ? "opacity-100" : "opacity-0",
              )}
            />
            <span>{option === "ru" ? t("Русский") : t("Английский")}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
