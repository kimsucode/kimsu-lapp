"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Mot de passe invalide.");
        } else {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          setError(payload.error || "Erreur serveur. Vérifie la configuration .env.local.");
        }
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Connexion impossible au serveur.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pt-[14vh] text-textPrimary">
      <main className="mx-auto w-full max-w-[420px]">
        <section className="rounded-soft border border-borderSubtle bg-surface p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Accès privé</p>
          <h1 className="mt-2 text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-textSecondary">Connexion sécurisée au dashboard.</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm text-textSecondary">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-borderSubtle bg-[#14141c] px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-lavender/45 focus:outline-none"
              />
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full border border-lavender/45 bg-lavender/20 px-5 py-2.5 text-sm font-medium text-lavender transition-colors duration-300 ease-calm hover:bg-lavender/30"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
