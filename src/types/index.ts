export interface WishlistItem {
  id: string;
  title: string;
  url: string | null;
  price: number | null;
  currency: string;
  priority: number;
  images: string[];
  notes: string | null;
  purchased: boolean;
  purchasedAt: string | null;
  userId: string;
  listId: string | null;
  user?: { id: string; name: string; avatarUrl?: string | null };
  tags: Tag[];
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

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CreateItemPayload {
  title: string;
  url?: string;
  price?: number;
  currency?: string;
  priority?: number;
  images?: string[];
  notes?: string;
  tags?: string[]; // tag names
  listId?: string | null;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  purchased?: boolean;
}

export interface ParsedProductResponse {
  title: string;
  price: number | null;
  currency: string;
  images: string[];
  url: string;
}

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
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
}

export interface UserWithStats extends User {
  stats: UserStats;
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
