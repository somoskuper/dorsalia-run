"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { highResolutionAvatar } from "@/lib/avatarImage";

export type AthletePublicProfile = {
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
};

type AthleteAuth = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Profile photo / name for chrome (tapbar, menu) — prefers athlete_profiles. */
  profile: AthletePublicProfile;
  refresh: () => Promise<void>;
  /** Optimistic update after avatar/name save in /cuenta. */
  patchProfile: (patch: Partial<AthletePublicProfile>) => void;
};

const emptyProfile: AthletePublicProfile = {
  avatarUrl: null,
  firstName: null,
  lastName: null,
  fullName: "Cuenta",
};

const Ctx = createContext<AthleteAuth>({
  user: null,
  session: null,
  loading: true,
  profile: emptyProfile,
  refresh: async () => {},
  patchProfile: () => {},
});

function metaAvatar(user: User | null): string | null {
  if (!user) return null;
  const m = user.user_metadata || {};
  if (typeof m.avatar_url === "string" && m.avatar_url.trim()) return highResolutionAvatar(m.avatar_url);
  if (typeof m.picture === "string" && m.picture.trim()) return highResolutionAvatar(m.picture);
  return null;
}

function metaNames(user: User | null): Pick<AthletePublicProfile, "firstName" | "lastName" | "fullName"> {
  if (!user) return { firstName: null, lastName: null, fullName: "Cuenta" };
  const m = user.user_metadata || {};
  const firstName = typeof m.first_name === "string" ? m.first_name : null;
  const lastName = typeof m.last_name === "string" ? m.last_name : null;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    (typeof m.full_name === "string" && m.full_name.trim()) ||
    (typeof m.name === "string" && m.name.trim()) ||
    user.email?.split("@")[0] ||
    "Cuenta";
  return { firstName, lastName, fullName };
}

function profileFromUser(user: User | null): AthletePublicProfile {
  const names = metaNames(user);
  return {
    avatarUrl: metaAvatar(user),
    ...names,
  };
}

export default function AthleteAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AthletePublicProfile>(emptyProfile);

  const loadAthleteProfile = useCallback(async (uid: string, fallbackUser: User | null) => {
    const base = profileFromUser(fallbackUser);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("athlete_profiles")
        .select("avatar_url, first_name, last_name")
        .eq("user_id", uid)
        .maybeSingle();
      if (!data) {
        setProfile(base);
        return;
      }
      const firstName = (data.first_name as string | null) || base.firstName;
      const lastName = (data.last_name as string | null) || base.lastName;
      const avatarUrl =
        highResolutionAvatar(data.avatar_url) || base.avatarUrl;
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ").trim() || base.fullName;
      setProfile({ avatarUrl, firstName, lastName, fullName });
    } catch {
      setProfile(base);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!hasSupabaseConfig()) return;
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const nextUser = userData.user ?? sessionData.session?.user ?? null;
      setUser(nextUser);
      setSession(sessionData.session);
      if (nextUser?.id) await loadAthleteProfile(nextUser.id, nextUser);
      else setProfile(emptyProfile);
    } catch {
      /* auth optional */
    }
  }, [loadAthleteProfile]);

  const patchProfile = useCallback((patch: Partial<AthletePublicProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      next.fullName =
        [next.firstName, next.lastName].filter(Boolean).join(" ").trim() ||
        next.fullName ||
        "Cuenta";
      return next;
    });
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = createClient();
      void (async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const { data: sessionData } = await supabase.auth.getSession();
          if (!mounted) return;
          const nextUser = userData.user ?? sessionData.session?.user ?? null;
          setUser(nextUser);
          setSession(sessionData.session);
          if (nextUser?.id) await loadAthleteProfile(nextUser.id, nextUser);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
        setTimeout(async () => {
        if (!mounted) return;
        setSession(next);
        const nextUser = next?.user ?? null;
        if (event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
          try {
            const { data } = await supabase.auth.getUser();
            const u = data.user ?? nextUser;
            if (!mounted) return;
            setUser(u);
            if (u?.id) await loadAthleteProfile(u.id, u);
          } catch {
            if (!mounted) return;
            setUser(nextUser);
            if (nextUser?.id) await loadAthleteProfile(nextUser.id, nextUser);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(emptyProfile);
        } else {
          setUser(nextUser);
          if (nextUser?.id) await loadAthleteProfile(nextUser.id, nextUser);
          else setProfile(emptyProfile);
        }
        setLoading(false);
        }, 0);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [loadAthleteProfile]);

  const value = useMemo(
    () => ({ user, session, loading, profile, refresh, patchProfile }),
    [user, session, loading, profile, refresh, patchProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAthleteAuth() {
  return useContext(Ctx);
}
