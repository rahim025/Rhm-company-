"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: string;
  role: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<Project[]>("/api/projects");
    setProjects(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api("/api/projects", { method: "POST", body: { name, description } });
      setName("");
      setDescription("");
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projets</h1>
          <p className="mt-1 text-sm text-[var(--paper-dim)]">Chacun provisionne son propre schéma Postgres isolé.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:brightness-110"
        >
          Nouveau projet
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="mt-6 flex flex-col gap-3 rounded-lg border border-[var(--ink-line)] bg-[var(--ink-raised)] p-5">
          <input
            required
            placeholder="Nom du projet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-[var(--ink-line)] bg-[var(--ink)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
          />
          <textarea
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-[var(--ink-line)] bg-[var(--ink)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
            rows={2}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="self-start rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:brightness-110 disabled:opacity-60"
          >
            {creating ? "Création…" : "Créer"}
          </button>
        </form>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {projects?.length === 0 && (
          <p className="text-sm text-[var(--paper-dim)]">Aucun projet pour l'instant. Créez-en un pour commencer.</p>
        )}
        {projects?.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/${p.id}`}
            className="rounded-lg border border-[var(--ink-line)] p-5 transition hover:border-[var(--paper-dim)]"
          >
            <p className="font-medium">{p.name}</p>
            {p.description && <p className="mt-1 text-sm text-[var(--paper-dim)]">{p.description}</p>}
            <p className="mono mt-3 text-xs text-[var(--paper-dim)]">{p.slug}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
