"use client";

export function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-[var(--paper-dim)]">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--ink-line)] bg-[var(--ink-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
      />
    </label>
  );
}
