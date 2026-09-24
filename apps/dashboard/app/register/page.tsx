"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { Field } from "../login/page";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      setToken(res.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      <p className="mt-1 text-sm text-[var(--paper-dim)]">Déployez votre premier projet en quelques minutes.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Nom" type="text" value={name} onChange={setName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Mot de passe (8 caractères min.)" type="password" value={password} onChange={setPassword} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-[var(--signal)] px-4 py-2.5 text-sm font-medium text-[#0e1013] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Création…" : "Créer le compte"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--paper-dim)]">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-[var(--paper)] underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
