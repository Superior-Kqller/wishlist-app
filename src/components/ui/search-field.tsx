"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchFieldProps extends Omit<InputProps, "onChange" | "type" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  wrapperClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
}

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onValueChange,
      wrapperClassName,
      inputClassName,
      iconClassName,
      placeholder = "Поиск…",
      ...props
    },
    ref,
  ) => (
    <div className={cn("relative min-w-0 w-full", wrapperClassName)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground",
          iconClassName,
        )}
        aria-hidden
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={cn("pl-8", inputClassName)}
        {...props}
      />
    </div>
  ),
);
SearchField.displayName = "SearchField";

export { SearchField };
