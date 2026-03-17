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
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск..."
          className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
        />
      </div>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-10 h-9 sm:h-10 sm:w-[180px] sm:px-3 shrink-0" title="Сортировка">
          <SlidersHorizontal className="w-4 h-4 sm:mr-2 shrink-0" />
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
        className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
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
