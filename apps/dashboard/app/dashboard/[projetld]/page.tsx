"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

type Tab = "overview" | "tables" | "sql" | "keys" | "docs" | "logs";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    api(`/api/projects/${projectId}`).then(setProject).catch(() => {});
  }, [projectId]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "tables", label: "Database Studio" },
    { id: "sql", label: "SQL Editor" },
    { id: "keys", label: "Clés API" },
    { id: "docs", label: "Documentation" },
    { id: "logs", label: "Logs" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">{project?.name ?? "…"}</h1>
      <p className="mono mt-1 text-xs text-[var(--paper-dim)]">{projectId}</p>

      <nav className="mt-6 flex gap-1 border-b border-[var(--ink-line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm transition ${
              tab === t.id
                ? "border-b-2 border-[var(--signal)] text-[var(--paper)]"
                : "text-[var(--paper-dim)] hover:text-[var(--paper)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "overview" && <Overview project={project} />}
        {tab === "tables" && <TableStudio projectId={projectId} />}
        {tab === "sql" && <SqlEditor projectId={projectId} />}
        {tab === "keys" && <ApiKeys projectId={projectId} />}
        {tab === "docs" && <Docs projectId={projectId} />}
        {tab === "logs" && <Logs projectId={projectId} />}
      </div>
    </div>
  );
}

function Overview({ project }: { project: any }) {
  if (!project) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat label="Tables" value={project.stats?.tableCount ?? 0} />
      <Stat label="Clés API actives" value={project.stats?.apiKeyCount ?? 0} />
      <Stat label="Rôle" value={project.role} />
      <div className="col-span-full mt-4">
        <p className="text-sm font-medium text-[var(--paper-dim)]">Activité récente</p>
        <div className="mt-2 divide-y divide-[var(--ink-line)] rounded-lg border border-[var(--ink-line)]">
          {(project.recentActivity ?? []).length === 0 && (
            <p className="p-4 text-sm text-[var(--paper-dim)]">Aucune activité pour l'instant.</p>
          )}
          {project.recentActivity?.map((log: any) => (
            <div key={log.id} className="mono flex justify-between p-3 text-xs">
              <span>{log.method} {log.endpoint}</span>
              <span className="text-[var(--paper-dim)]">{log.statusCode} · {log.durationMs}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--ink-line)] p-4">
      <p className="text-sm text-[var(--paper-dim)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

// ---------- Database Studio ----------

const COLUMN_TYPES = ["text", "integer", "bigint", "boolean", "timestamptz", "date", "uuid", "jsonb", "numeric"];

function TableStudio({ projectId }: { projectId: string }) {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTable, setNewTable] = useState("");
  const [newCols, setNewCols] = useState([{ name: "name", type: "text", notNull: true, unique: false, primaryKey: false }]);
  const [error, setError] = useState<string | null>(null);

  async function loadTables() {
    const { tables } = await api<{ tables: string[] }>(`/api/projects/${projectId}/tables`);
    setTables(tables);
  }

  async function selectTable(name: string) {
    setSelected(name);
    const t = await api<{ columns: any[] }>(`/api/projects/${projectId}/tables/${name}`);
    setColumns(t.columns);
  }

  useEffect(() => {
    loadTables().catch(() => {});
  }, [projectId]);

  async function onCreateTable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/api/projects/${projectId}/tables`, {
        method: "POST",
        body: { name: newTable, columns: newCols },
      });
      setShowCreate(false);
      setNewTable("");
      setNewCols([{ name: "name", type: "text", notNull: true, unique: false, primaryKey: false }]);
      await loadTables();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function onDropTable(name: string) {
    if (!confirm(`Supprimer la table "${name}" ? Cette action est irréversible.`)) return;
    await api(`/api/projects/${projectId}/tables/${name}`, { method: "DELETE" });
    if (selected === name) setSelected(null);
    await loadTables();
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
      <div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="w-full rounded-md border border-[var(--ink-line)] px-3 py-2 text-sm hover:border-[var(--paper-dim)]"
        >
          + Nouvelle table
        </button>
        <div className="mt-3 flex flex-col">
          {tables.map((t) => (
            <div key={t} className="group flex items-center justify-between">
              <button
                onClick={() => selectTable(t)}
                className={`mono flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm ${
                  selected === t ? "bg-[var(--ink-raised)] text-[var(--signal)]" : "text-[var(--paper-dim)] hover:text-[var(--paper)]"
                }`}
              >
                {t}
              </button>
              <button
                onClick={() => onDropTable(t)}
                className="hidden px-1 text-xs text-red-400 group-hover:inline"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        {showCreate && (
          <form onSubmit={onCreateTable} className="mb-6 rounded-lg border border-[var(--ink-line)] bg-[var(--ink-raised)] p-5">
            <input
              required
              placeholder="nom_de_la_table"
              value={newTable}
              onChange={(e) => setNewTable(e.target.value)}
              className="mono w-full rounded-md border border-[var(--ink-line)] bg-[var(--ink)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
            />
            <div className="mt-4 flex flex-col gap-2">
              {newCols.map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="colonne"
                    value={col.name}
                    onChange={(e) => {
                      const c = [...newCols];
                      c[i] = { ...c[i], name: e.target.value };
                      setNewCols(c);
                    }}
                    className="mono flex-1 rounded-md border border-[var(--ink-line)] bg-[var(--ink)] px-2 py-1.5 text-xs outline-none focus:border-[var(--signal)]"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const c = [...newCols];
                      c[i] = { ...c[i], type: e.target.value };
                      setNewCols(c);
                    }}
                    className="mono rounded-md border border-[var(--ink-line)] bg-[var(--ink)] px-2 py-1.5 text-xs outline-none"
                  >
                    {COLUMN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-[var(--paper-dim)]">
                    <input
                      type="checkbox"
                      checked={col.notNull}
                      onChange={(e) => {
                        const c = [...newCols];
                        c[i] = { ...c[i], notNull: e.target.checked };
                        setNewCols(c);
                      }}
                    />
                    not null
                  </label>
                  <label className="flex items-center gap-1 text-xs text-[var(--paper-dim)]">
                    <input
                      type="checkbox"
                      checked={col.unique}
                      onChange={(e) => {
                        const c = [...newCols];
                        c[i] = { ...c[i], unique: e.target.checked };
                        setNewCols(c);
                      }}
                    />
                    unique
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewCols(newCols.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewCols([...newCols, { name: "", type: "text", notNull: false, unique: false, primaryKey: false }])}
                className="self-start text-xs text-[var(--paper-dim)] hover:text-[var(--paper)]"
              >
                + Ajouter une colonne
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--paper-dim)]">
              Une colonne "id" (uuid, clé primaire) est ajoutée automatiquement si aucune n'est définie.
            </p>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="mt-4 rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[#0e1013] hover:brightness-110"
            >
              Créer la table
            </button>
          </form>
        )}

        {selected && (
          <div>
            <p className="mono text-sm font-medium">{selected}</p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--ink-line)]">
              <table className="mono w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--ink-line)] text-left text-[var(--paper-dim)]">
                    <th className="p-2">colonne</th>
                    <th className="p-2">type</th>
                    <th className="p-2">nullable</th>
                    <th className="p-2">pk</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((c) => (
                    <tr key={c.column_name} className="border-b border-[var(--ink-line)] last:border-0">
                      <td className="p-2">{c.column_name}</td>
                      <td className="p-2 text-[var(--paper-dim)]">{c.data_type}</td>
                      <td className="p-2 text-[var(--paper-dim)]">{c.is_nullable}</td>
                      <td className="p-2 text-[var(--paper-dim)]">{c.is_primary_key ? "✓" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[var(--paper-dim)]">
              Utilisez le SQL Editor ou l'API REST (onglet Documentation) pour lire/écrire des lignes.
            </p>
          </div>
        )}
        {!selected && !showCreate && <p className="text-sm text-[var(--paper-dim)]">Sélectionnez une table à gauche.</p>}
      </div>
    </div>
  );
}

// ---------- SQL Editor ----------

function SqlEditor({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("SELECT * FROM information_schema.tables LIMIT 10;");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await api(`/api/projects/${projectId}/sql`, { method: "POST", body: { query } });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={6}
        className="mono w-full rounded-lg border border-[var(--ink-line)] bg-[var(--ink-raised)] p-4 text-sm outline-none focus:border-[var(--signal)]"
      />
      <button
        onClick={run}
        disabled={running}
        className="mt-3 rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[#0e1013] hover:brightness-110 disabled:opacity-60"
      >
        {running ? "Exécution…" : "Exécuter"}
      </button>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-4">
          <p className="text-xs text-[var(--paper-dim)]">
            {result.rowCount ?? 0} ligne(s) · {result.durationMs}ms
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--ink-line)]">
            <table className="mono w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--ink-line)] text-left text-[var(--paper-dim)]">
                  {result.fields?.map((f: string) => (
                    <th key={f} className="p-2">{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows?.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-[var(--ink-line)] last:border-0">
                    {result.fields?.map((f: string) => (
                      <td key={f} className="p-2">{JSON.stringify(row[f])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- API Keys ----------

function ApiKeys({ projectId }: { projectId: string }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<{ fullKey: string; prefix: string } | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"PUBLIC" | "SECRET">("PUBLIC");

  async function load() {
    setKeys(await api(`/api/projects/${projectId}/keys`));
  }

  useEffect(() => {
    load().catch(() => {});
  }, [projectId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await api<{ fullKey: string; prefix: string }>(`/api/projects/${projectId}/keys`, {
      method: "POST",
      body: { name, type },
    });
    setNewKey(res);
    setName("");
    await load();
  }

  async function onRevoke(keyId: string) {
    await api(`/api/projects/${projectId}/keys/${keyId}/revoke`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <form onSubmit={onCreate} className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-[var(--paper-dim)]">Nom</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-[var(--ink-line)] bg-[var(--ink-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-[var(--paper-dim)]">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "PUBLIC" | "SECRET")}
            className="rounded-md border border-[var(--ink-line)] bg-[var(--ink-raised)] px-3 py-2 text-sm outline-none"
          >
            <option value="PUBLIC">Publique (lecture seule)</option>
            <option value="SECRET">Secrète (lecture/écriture)</option>
          </select>
        </div>
        <button className="rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[#0e1013] hover:brightness-110">
          Générer
        </button>
      </form>

      {newKey && (
        <div className="mt-4 rounded-lg border border-[var(--signal)] bg-[var(--ink-raised)] p-4">
          <p className="text-sm">Copiez cette clé maintenant — elle ne sera plus jamais affichée.</p>
          <p className="mono mt-2 break-all rounded bg-[var(--ink)] p-2 text-sm text-[var(--signal)]">{newKey.fullKey}</p>
        </div>
      )}

      <div className="mt-6 divide-y divide-[var(--ink-line)] rounded-lg border border-[var(--ink-line)]">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm">{k.name} <span className="text-[var(--paper-dim)]">· {k.type}</span></p>
              <p className="mono text-xs text-[var(--paper-dim)]">{k.prefix}…</p>
            </div>
            {!k.revokedAt ? (
              <button onClick={() => onRevoke(k.id)} className="text-xs text-red-400">Révoquer</button>
            ) : (
              <span className="text-xs text-[var(--paper-dim)]">révoquée</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Docs ----------

function Docs({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<any>(null);

  useEffect(() => {
    api(`/api/projects/${projectId}/docs`).then(setDocs).catch(() => {});
  }, [projectId]);

  if (!docs) return <p className="text-sm text-[var(--paper-dim)]">Chargement…</p>;
  if (!docs.tables?.length) return <p className="text-sm text-[var(--paper-dim)]">Créez une table pour voir sa documentation.</p>;

  return (
    <div className="flex flex-col gap-8">
      {docs.tables.map((t: any) => (
        <div key={t.table}>
          <p className="mono font-medium">{t.table}</p>
          <div className="mt-2 flex flex-col gap-2">
            {t.endpoints.map((ep: any, i: number) => (
              <div key={i} className="rounded-md border border-[var(--ink-line)] p-3">
                <p className="mono text-xs">
                  <span className="text-[var(--signal)]">{ep.method}</span> {ep.path}
                </p>
                <p className="mt-1 text-xs text-[var(--paper-dim)]">{ep.description}</p>
                <p className="mono mt-1 text-xs text-[var(--paper-dim)]">header: x-api-key</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Logs ----------

function Logs({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api<{ data: any[] }>(`/api/projects/${projectId}/logs`).then((r) => setLogs(r.data)).catch(() => {});
  }, [projectId]);

  return (
    <div className="divide-y divide-[var(--ink-line)] rounded-lg border border-[var(--ink-line)]">
      {logs.length === 0 && <p className="p-4 text-sm text-[var(--paper-dim)]">Aucun log pour l'instant.</p>}
      {logs.map((log) => (
        <div key={log.id} className="mono flex items-center justify-between p-3 text-xs">
          <span>{log.method} {log.endpoint}</span>
          <span className="text-[var(--paper-dim)]">
            {log.statusCode} · {log.durationMs}ms · {new Date(log.createdAt).toLocaleString("fr-FR")}
          </span>
        </div>
      ))}
    </div>
  );
}
