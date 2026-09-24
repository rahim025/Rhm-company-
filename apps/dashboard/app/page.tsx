import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <p className="mono text-sm tracking-tight text-[var(--paper-dim)]">rhm-base / self-hosted</p>
      <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight">
        Votre backend,
        <br />
        sur votre infrastructure.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--paper-dim)]">
        Base de données Postgres, authentification, API REST générée automatiquement,
        stockage de fichiers et temps réel — un projet à la fois, sans dépendre d'un
        fournisseur tiers.
      </p>

      <div className="mt-9 flex gap-3">
        <Link
          href="/register"
          className="rounded-md bg-[var(--signal)] px-5 py-2.5 text-sm font-medium text-[#0e1013] transition hover:brightness-110"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-[var(--ink-line)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:border-[var(--paper-dim)]"
        >
          Se connecter
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 border-t border-[var(--ink-line)] pt-8 sm:grid-cols-3">
        {[
          ["Database Studio", "Créez tables et colonnes sans écrire de DDL."],
          ["API instantanée", "Chaque table devient un endpoint REST, en direct."],
          ["Clés & rôles", "Contrôlez l'accès public, secret et par projet."],
        ].map(([title, desc]) => (
          <div key={title}>
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm text-[var(--paper-dim)]">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
