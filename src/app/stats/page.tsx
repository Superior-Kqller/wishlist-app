import { redirect } from "next/navigation";

// Статистика стала вкладкой «Подарочных профилей»; старые ссылки ведут туда.
export default function StatsPage() {
  redirect("/preferences?tab=stats");
}
