"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Неверный логин или пароль");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center page-bg">
      <div className="w-full max-w-sm mx-4">
        <div className="rounded-2xl border border-border/75 bg-card/72 p-8 shadow-[0_14px_44px_rgba(0,0,0,0.42)] backdrop-blur-[16px]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 border border-cyan-400/28 bg-primary/15 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_14px_rgba(6,182,212,0.22)]">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Вишлист</h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              Войдите в свой аккаунт
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-cyan-200/75">
              <Sparkles className="h-3 w-3" />
              Dark glass access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              type="text"
              placeholder="Введите логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive text-center animate-fade-in">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full interactive-glow" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Войти
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}
