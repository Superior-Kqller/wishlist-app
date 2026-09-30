"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { uiLayout, uiState } from "@/lib/ui-contract";
import { SegmentGlide } from "@/components/ui/segment-glide";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      uiLayout.segmentBar,
      "auto-cols-fr grid-flow-col text-muted-foreground",
      className,
    )}
    {...props}
  >
    <SegmentGlide />
    {children}
  </TabsPrimitive.List>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex min-h-11 min-w-0 items-center justify-center gap-2 whitespace-nowrap border px-4 text-sm font-semibold ring-offset-background transition-colors duration-[var(--dur-base)] ease-[var(--ease-soft)] disabled:pointer-events-none disabled:opacity-50 sm:min-h-10",
      uiState.focusRing,
      uiState.segmentIdle,
      // Активная вкладка — тот же выбранный сегмент, что у кнопок: пилюля чернилами.
      "data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background in-data-[glide=ready]:data-[state=active]:border-transparent in-data-[glide=ready]:data-[state=active]:bg-transparent",
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
