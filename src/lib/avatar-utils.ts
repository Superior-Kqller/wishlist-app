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
    "bg-[hsl(263_60%_48%)]",
    "bg-[hsl(280_50%_45%)]",
    "bg-[hsl(245_45%_50%)]",
    "bg-[hsl(300_40%_42%)]",
    "bg-[hsl(220_50%_48%)]",
    "bg-[hsl(340_45%_45%)]",
    "bg-[hsl(190_45%_42%)]",
    "bg-[hsl(160_40%_40%)]",
    "bg-[hsl(25_50%_45%)]",
    "bg-[hsl(50_45%_42%)]",
  ];

  // Простой hash для детерминированного выбора цвета
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }

  return colors[Math.abs(hash) % colors.length];
}
