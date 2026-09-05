import type { GiftPreferences } from "@/lib/preferences";

export type ItemStatus = "AVAILABLE" | "PURCHASED";

export interface WishlistItem {
  id: string;
  title: string;
  url: string | null;
  price: number | null;
  currency: string;
  priority: number;
  /** Превью: используется только первый URL; новые записи — не более одного */
  images: string[];
  notes: string | null;
  purchased: boolean;
  purchasedAt: string | null;
  status: ItemStatus;
  userId: string;
  listId: string | null;
  user?: { id: string; name: string; avatarUrl?: string | null };
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListWithMeta extends List {
  _count: { items: number };
  viewerIds: string[];
}

export interface ItemComment {
  id: string;
  text: string;
  itemId: string;
  userId: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
}

export interface ItemsPage {
  items: WishlistItem[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
  };
}

export interface CreateItemPayload {
  title: string;
  url?: string;
  price?: number;
  currency?: string;
  priority?: number;
  notes?: string;
  /** Не более одного URL изображения */
  images?: string[];
  category?: string | null;
  listId?: string | null;
}

export interface UpdateItemPayload extends Partial<
  Omit<CreateItemPayload, "url" | "price" | "notes" | "listId">
> {
  url?: string | null;
  price?: number | null;
  notes?: string | null;
  listId?: string | null;
  purchased?: boolean;
  status?: ItemStatus;
}

export interface ParsedProductResponse {
  title: string;
  price: number | null;
  currency: string;
  images: string[];
  url: string;
  /** Краткое описание со страницы (Open Graph) */
  description?: string;
}

export type UserRole = "USER" | "ADMIN";
export type TelegramLinkStatus = "not_configured" | "pending" | "linked";
export type BirthdayAudience = "ALL" | "SELECTED" | "PRIVATE";

export interface BirthdayProfile {
  day: number;
  month: number;
  year: number | null;
  audience: BirthdayAudience;
  selectedViewerIds: string[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramLinkedAt?: string | null;
  telegramConfirmedAt?: string | null;
  telegramNotificationsEnabled?: boolean;
  telegramLinkStatus?: TelegramLinkStatus;
  giftPreferences?: GiftPreferences | null;
  birthday?: BirthdayProfile | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

export interface UserStats {
  totalItems: number;
  unpurchasedItems: number;
  totalWishlistValue: number;
  totalPurchasedValue: number;
  currency?: string;
  pricesByCurrency?: Record<string, { unpurchased: number; purchased: number }>;
  priorityCounts?: Record<string, number>;
}

export interface UserWithStats extends User {
  stats: UserStats;
}

export interface StatsTopItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  priority: number;
  userId: string;
  userName: string;
}

export interface StatsSummary {
  totalItems: number;
  unpurchasedItems: number;
  memberCount: number;
  pricesByCurrency: Record<string, { unpurchased: number; purchased: number }>;
  priorityCounts: Record<string, number>;
  topItems: StatsTopItem[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  username?: string;
  name?: string;
  role?: UserRole;
}
