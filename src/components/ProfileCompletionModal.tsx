"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import { OnboardingForm } from "@/components/OnboardingForm";

export default function ProfileCompletionModal() {
  const pathname = usePathname();
  const [required, setRequired] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setRequired(false);
        return;
      }
      const { data: profile } = await supabase
        .from("athlete_profiles")
        .select("username, first_name, last_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      const metadataProfileComplete =
        user.user_metadata?.athlete_onboarding_done === true &&
        Boolean(String(user.user_metadata?.username || "").trim());
      if (active) {
        setRequired(!(metadataProfileComplete || isAthleteOnboarded(user.user_metadata, profile)));
      }
    }

    void checkProfile();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void checkProfile();
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (!required || pathname === "/activar-inscripcion" || pathname === "/onboarding" || pathname.startsWith("/auth")) return null;

  return (
    <div className="fixed inset-0 z-[100] h-dvh w-screen overflow-y-auto bg-black px-5 py-8 sm:px-8" role="dialog" aria-modal="true" aria-label="Completa tu perfil">
      <div className="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center">
        <OnboardingForm />
      </div>
    </div>
  );
}
