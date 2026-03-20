"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, Eye, EyeOff } from "lucide-react";

interface SearchAndFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchased: () => void;
}

export function SearchAndFilter({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  showPurchased,
  onTogglePurchased,
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-row gap-2 sm:gap-3">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground/80 sm:left-3" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск..."
          className="h-11 bg-card pl-8 text-sm placeholder:text-muted-foreground/85 sm:h-10 sm:pl-10"
        />
      </div>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="h-11 w-11 shrink-0 bg-card sm:h-10 sm:w-[180px] sm:px-3" title="Сортировка">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground/85 sm:mr-2" />
          <SelectValue placeholder="Сортировка" className="sr-only sm:not-sr-only sm:inline" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Новые сначала</SelectItem>
          <SelectItem value="oldest">Старые сначала</SelectItem>
          <SelectItem value="priority-high">Приоритет ↓</SelectItem>
          <SelectItem value="priority-low">Приоритет ↑</SelectItem>
          <SelectItem value="price-high">Цена ↓</SelectItem>
          <SelectItem value="price-low">Цена ↑</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant={showPurchased ? "secondary" : "outline"}
        size="icon"
        className="h-11 w-11 sm:h-10 sm:w-10 shrink-0"
        onClick={onTogglePurchased}
        title={showPurchased ? "Скрыть купленные" : "Показать купленные"}
      >
        {showPurchased ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
