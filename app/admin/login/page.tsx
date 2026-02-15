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

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setIsLoading(false);

    if (!response.ok) {
      setError("Mot de passe invalide.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main>
      <section className="card" style={{ maxWidth: 420, margin: "12vh auto 0" }}>
        <h1 className="section-title">Admin</h1>
        <p className="muted">Connexion privée</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p style={{ color: "#a11515", margin: "0 0 10px" }}>{error}</p>
          ) : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}
