"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth";

export default function SettingsSignOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    setError(false);
    const result = await signOut();
    if (result.error) {
      setError(true);
      setBusy(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="mt-[30px] text-center">
      <button type="button" onClick={() => void handleSignOut()} disabled={busy} className="text-[20px] font-semibold leading-6 underline underline-offset-4 disabled:opacity-50" style={{ color: "#DE5757" }}>
        Cerrar sesión
      </button>
      {error ? <p className="mt-2 text-sm text-[#DE5757]">No se pudo cerrar la sesión. Inténtalo de nuevo.</p> : null}
    </div>
  );
}
