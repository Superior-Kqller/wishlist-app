"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Palette } from "lucide-react";

export function ThemeSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Тема оформления
        </CardTitle>
        <CardDescription>
          Выберите цветовую схему и режим отображения
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Внешний вид</p>
            <p className="text-xs text-muted-foreground">
              Настройте цветовую тему и режим (светлый/тёмный)
            </p>
          </div>
          <ThemeSelector />
        </div>
      </CardContent>
    </Card>
  );
}
