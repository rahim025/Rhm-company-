import Link from "next/link";

const TABLE_ROWS = [
  { id: "8f2a…", email: "amina@exemple.com", plan: "pro", created_at: "2026-08-02" },
  { id: "c910…", email: "lea@exemple.com", plan: "free", created_at: "2026-08-04" },
  { id: "4d6e…", email: "omar@exemple.com", plan: "pro", created_at: "2026-08-11" },
];

const FEATURES: [string, string][] = [
  ["Database Studio", "Créez et modifiez tables et colonnes sans écrire de DDL — c'est du SQL réel exécuté sur votre schéma."],
  ["API REST automatique", "Chaque table expose GET, POST, PATCH et DELETE dès sa création, avec pagination, tri et filtres."],
  ["Clés & rôles", "Clés publiques en lecture seule, clés secrètes en lecture-écriture, révocables à tout moment."],
  ["Stockage & temps réel", "Buckets de fichiers avec URLs signées, et notifications WebSocket sur chaque écriture."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="mono text-sm text-[var(--paper)]">rhm-base</span>
        <nav className="flex items-center gap-6">
          <a
            href="https://github.com/"
            className="hidden text-sm text-[var(--paper-dim)] transition hover:text-[var(--paper)] sm:inline"
          >
            Code source
          </a>
          <Link href="/login" className="text-sm text-[var(--paper-dim)] transition hover:text-[var(--paper)]">
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:brightness-110"
          >
            Créer un compte
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="grid grid-cols-1 gap-14 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <h1 className="serif text-[2.75rem] font-medium leading-[1.1] tracking-tight sm:text-5xl">
              Votre backend, sur votre propre infrastructure.
            </h1>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-[var(--paper-dim)]">
              Postgres, authentification, API REST générée automatiquement, stockage de
              fichiers et temps réel. Un projet à la fois, hébergé où vous le décidez.
            </p>

            <div className="mt-8 flex gap-3">
              <Link
                href="/register"
                className="rounded-md bg-[var(--signal)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:brightness-110"
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
          </div>

          <div className="rounded-lg border border-[var(--ink-line)] bg-[var(--ink-raised)]">
            <div className="flex items-center justify-between border-b border-[var(--ink-line)] px-4 py-3">
              <span className="mono text-xs text-[var(--paper-dim)]">table · users</span>
              <span className="mono text-xs text-[var(--signal)]">4 colonnes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="mono w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--paper-dim)]">
                    <th className="px-4 py-2 font-normal">id</th>
                    <th className="px-4 py-2 font-normal">email</th>
                    <th className="px-4 py-2 font-normal">plan</th>
                    <th className="px-4 py-2 font-normal">created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--ink-line)]">
                      <td className="px-4 py-2 text-[var(--paper-dim)]">{row.id}</td>
                      <td className="px-4 py-2">{row.email}</td>
                      <td className="px-4 py-2 text-[var(--paper-dim)]">{row.plan}</td>
                      <td className="px-4 py-2 text-[var(--paper-dim)]">{row.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--ink-line)] px-4 py-3">
              <p className="mono text-xs text-[var(--paper-dim)]">
                <span className="text-[var(--signal)]">GET</span> /api/tables/users
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--ink-line)] py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="serif text-2xl font-medium">Une table devient une API sans configuration.</h2>
              <p className="mt-3 max-w-[38ch] text-[var(--paper-dim)]">
                Créez une colonne dans Database Studio, et l&apos;endpoint correspondant est
                disponible à la seconde — authentifié par une clé API par projet.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--ink-line)] bg-[var(--ink-raised)] p-5">
              <p className="mono text-xs text-[var(--paper-dim)]">
                curl https://votre-domaine.tld/api/tables/users \<br />
                &nbsp;&nbsp;-H &quot;x-api-key: pub_a1b2c3…&quot;
              </p>
              <div className="mt-4 border-t border-[var(--ink-line)] pt-4">
                <p className="mono text-xs leading-relaxed text-[var(--paper)]">
                  {"{"}<br />
                  &nbsp;&nbsp;&quot;data&quot;: [{"{ id, email, plan, created_at }"}, …],<br />
                  &nbsp;&nbsp;&quot;count&quot;: 128<br />
                  {"}"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--ink-line)] py-14">
          <h2 className="serif text-2xl font-medium">Ce qui est déjà inclus</h2>
          <div className="mt-8 divide-y divide-[var(--ink-line)]">
            {FEATURES.map(([title, desc]) => (
              <div key={title} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[220px_1fr]">
                <p className="font-medium">{title}</p>
                <p className="max-w-[52ch] text-[var(--paper-dim)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-[var(--ink-line)] px-6 py-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-[var(--paper-dim)]">
            Développé par Batchabi Rahim · licence MIT
          </p>
          <p className="mono text-xs text-[var(--paper-dim)]">rhm-base — auto-hébergé</p>
        </div>
      </footer>
    </div>
  );
}
