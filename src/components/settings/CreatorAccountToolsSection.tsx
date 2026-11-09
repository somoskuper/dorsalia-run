"use client";

import { useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import SettingsSection from "@/components/settings/SettingsSection";

export default function CreatorAccountToolsSection() {
  const { user } = useAthleteAuth();
  const [creator, setCreator] = useState(false);
  useEffect(() => {
    if (!user) { setCreator(false); return; }
    let active = true;
    void createClient().from("creator_profiles").select("is_active").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (active) setCreator(data?.is_active === true); });
    return () => { active = false; };
  }, [user]);
  const links = [
    { label: "Información de la cuenta", icon: "account-info.svg" },
    { label: "Tipo de cuenta", icon: "account-type.svg", href: "/settings/account-type" },
    ...(creator ? [{ label: "Herramientas profesionales", icon: "account-business.svg", href: "/creator" }] : []),
    { label: "Aplicaciones conectadas", icon: "account-connected.svg" },
  ];
  return <SettingsSection title="Cuentas y herramientas" links={links} />;
}
