"use client";

import { useState } from "react";
import Image from "next/image";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  userId?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

export function UserAvatar({
  avatarUrl,
  name,
  userId,
  size = "md",
  className,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const initials = getInitials(name);
  const colorClass = userId ? getAvatarColor(userId) : "bg-gray-500";

  // Показываем изображение только если есть avatarUrl и не было ошибки загрузки
  if (avatarUrl && !imageError) {
    return (
      <div className={cn("relative rounded-full overflow-hidden", sizeClass, className)}>
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={`${size === "sm" ? 24 : size === "md" ? 32 : size === "lg" ? 40 : 48}px`}
          onError={() => setImageError(true)}
          unoptimized={avatarUrl.startsWith("/uploads/")} // Отключаем оптимизацию для локальных файлов
        />
      </div>
    );
  }

  // Fallback на инициалы если нет avatarUrl или была ошибка загрузки
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium",
        colorClass,
        sizeClass,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
