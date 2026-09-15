"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { uiLayout, uiState } from "@/lib/ui-contract";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      uiLayout.segmentBar,
      "auto-cols-fr grid-flow-col text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex min-h-11 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold ring-offset-background transition-colors duration-[var(--dur-base)] ease-[var(--ease-soft)] disabled:pointer-events-none disabled:opacity-50 sm:min-h-10",
      uiState.focusRing,
      uiState.segmentIdle,
      // Активная вкладка берёт тот же рецепт, что и выбранный сегмент кнопки:
      // ступень поверхности плюс метка голосом краски. До этого вкладки жили
      // по умолчаниям shadcn (`bg-muted` + белая плашка) — вторая, чужая
      // конвенция переключателя в одном продукте.
      "data-[state=active]:border-border/70 data-[state=active]:bg-[hsl(var(--surface-4))] data-[state=active]:text-foreground",
      "data-[state=active]:after:pointer-events-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:bottom-1 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary-accent",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
