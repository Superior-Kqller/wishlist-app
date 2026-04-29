/**
 * Генерирует инициалы из имени пользователя
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Генерирует цвет для аватара на основе userId (детерминированно)
 */
export function getAvatarColor(userId: string): string {
  const colors = [
    "bg-[hsl(var(--avatar-1))]",
    "bg-[hsl(var(--avatar-2))]",
    "bg-[hsl(var(--avatar-3))]",
    "bg-[hsl(var(--avatar-4))]",
    "bg-[hsl(var(--avatar-5))]",
    "bg-[hsl(var(--avatar-6))]",
    "bg-[hsl(var(--avatar-7))]",
    "bg-[hsl(var(--avatar-8))]",
    "bg-[hsl(var(--avatar-9))]",
    "bg-[hsl(var(--avatar-10))]",
  ];

  // Простой hash для детерминированного выбора цвета
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }

  return colors[Math.abs(hash) % colors.length];
}
