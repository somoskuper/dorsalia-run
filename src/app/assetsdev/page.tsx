"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AssetFile = {
  name: string;
  dir: string;
  url: string;
  publicPath?: string;
  size: number;
  mtime?: string;
  ext: string;
};

const PREVIEW_EXT = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico"]);

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetsDevPage() {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [dir, setDir] = useState<"assetsdev" | "branding">("assetsdev");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssetFile | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/assetsdev", { cache: "no-store" });
    if (!res.ok) {
      setError("No se pudo listar archivos");
      return;
    }
    const data = (await res.json()) as { files: AssetFile[] };
    setFiles(data.files || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setRenameValue(selected?.name || "");
  }, [selected]);

  const grouped = useMemo(() => {
    const assetsdev = files.filter((f) => f.dir === "assetsdev");
    const branding = files.filter((f) => f.dir === "branding");
    return { assetsdev, branding };
  }, [files]);

  async function onUpload(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      for (const file of Array.from(list)) {
        const form = new FormData();
        form.append("file", file);
        form.append("dir", dir);
        const res = await fetch("/api/assetsdev", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Error subiendo ${file.name}`);
      }
      setMsg(`Subido a /${dir}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(file: AssetFile) {
    if (!confirm(`¿Borrar ${file.dir}/${file.name}?`)) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/assetsdev", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dir: file.dir, name: file.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo borrar");
      if (selected?.url === file.url) setSelected(null);
      setMsg(`Eliminado ${file.name}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar");
    } finally {
      setBusy(false);
    }
  }

  async function onRename(file: AssetFile) {
    const next = renameValue.trim();
    if (!next || next === file.name) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/assetsdev", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dir: file.dir, name: file.name, newName: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo renombrar");
      setMsg(`Renombrado → ${data.file?.name || next}`);
      await load();
      if (data.file) {
        setSelected({
          name: data.file.name,
          dir: data.file.dir,
          url: data.file.url,
          publicPath: data.file.publicPath,
          size: file.size,
          ext: data.file.name.includes(".")
            ? `.${data.file.name.split(".").pop()}`
            : file.ext,
          mtime: new Date().toISOString(),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al renombrar");
    } finally {
      setBusy(false);
    }
  }

  function FileGrid({ title, items }: { title: string; items: AssetFile[] }) {
    return (
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
          {title}{" "}
          <span className="text-white/30">({items.length})</span>
        </h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">Vacío</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((f) => {
              const canPreview = PREVIEW_EXT.has(f.ext);
              const active = selected?.url === f.url;
              return (
                <li key={`${f.dir}/${f.name}`}>
                  <div
                    className={`overflow-hidden rounded-xl border transition-colors ${
                      active
                        ? "border-[#C5E500] bg-white/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(f)}
                      className="w-full text-left"
                    >
                      <div className="grid aspect-square place-items-center bg-black/40 p-3">
                        {canPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${f.url}?t=${encodeURIComponent(f.mtime || "")}`}
                            alt={f.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="font-mono text-xs uppercase text-white/40">
                            {f.ext || "file"}
                          </span>
                        )}
                      </div>
                      <div className="border-t border-white/10 px-2.5 py-2">
                        <p className="truncate text-[12px] text-white/90" title={f.name}>
                          {f.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/40">{formatBytes(f.size)}</p>
                      </div>
                    </button>
                    <div className="flex gap-1 border-t border-white/10 p-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setSelected(f)}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/70 hover:bg-white/10 disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onDelete(f)}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5E500]">
          Temporal · redesign
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">assetsdev</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Sube SVG/PNG/PDF aquí. Puedes renombrar y eliminar en{" "}
          <code className="text-white/80">assetsdev</code> y{" "}
          <code className="text-white/80">branding</code>. La vista previa usa la API
          (Next no sirve bien archivos nuevos en <code className="text-white/80">public/</code>{" "}
          en runtime).
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-end">
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
              Destino
            </span>
            <select
              value={dir}
              onChange={(e) => setDir(e.target.value as "assetsdev" | "branding")}
              className="h-11 rounded-xl border border-white/15 bg-black px-3 text-sm outline-none"
            >
              <option value="assetsdev">public/assetsdev</option>
              <option value="branding">public/branding</option>
            </select>
          </label>

          <label className="block flex-1 text-sm">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
              Archivos
            </span>
            <input
              type="file"
              multiple
              disabled={busy}
              accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.ico,.woff,.woff2,.otf,.ttf,.css,.json,.txt,.md,.pdf"
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#C5E500] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#070707]"
            />
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="h-11 rounded-full border border-white/15 px-5 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
          >
            Refrescar
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {msg ? <p className="mt-4 text-sm text-[#C5E500]">{msg}</p> : null}

        {selected ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Seleccionado · {selected.dir}
                </p>
                <label className="mt-3 block text-sm">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
                    Renombrar
                  </span>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="h-11 w-full max-w-md rounded-xl border border-white/15 bg-black px-3 font-mono text-sm outline-none focus:border-[#C5E500]"
                  />
                </label>
                <p className="mt-2 break-all text-xs text-white/45">{selected.url}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !renameValue.trim() || renameValue.trim() === selected.name}
                  onClick={() => void onRename(selected)}
                  className="inline-flex h-10 items-center rounded-full bg-[#C5E500] px-4 text-sm font-semibold text-[#070707] disabled:opacity-50"
                >
                  Guardar nombre
                </button>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#070707]"
                >
                  Abrir
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDelete(selected)}
                  className="inline-flex h-10 items-center rounded-full border border-red-400/40 px-4 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </div>
            {PREVIEW_EXT.has(selected.ext) ? (
              <div className="mt-5 grid max-h-[360px] place-items-center overflow-auto rounded-xl border border-white/10 bg-[#111] p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${selected.url}?t=${encodeURIComponent(selected.mtime || "")}`}
                  alt={selected.name}
                  className="max-h-[320px] max-w-full object-contain"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <FileGrid title="public/assetsdev" items={grouped.assetsdev} />
        <FileGrid title="public/branding" items={grouped.branding} />
      </div>
    </div>
  );
}
