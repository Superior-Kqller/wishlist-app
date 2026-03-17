import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen page-bg flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-semibold tracking-tight text-muted-foreground">
        404
      </h1>
      <p className="mt-2 text-muted-foreground">Страница не найдена</p>
      <Button asChild className="mt-6">
        <Link href="/">На главную</Link>
      </Button>
    </div>
  );
}
