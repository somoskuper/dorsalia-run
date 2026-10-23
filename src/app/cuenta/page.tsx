"use client";

import AccountProfileView from "@/components/account/AccountProfileView";
import AccountSubpageHeader from "@/components/account/AccountSubpageHeader";
import SavedRacesView from "@/components/account/SavedRacesView";
import EditProfileSheet, {
  MAX_FEATURED_MEDALS,
  type EditProfileDraft,
} from "@/components/account/EditProfileSheet";
import {
  PurchaseSummary,
  PurchasesList,
  type PurchaseListItem,
} from "@/components/account/PurchasesView";
import {
  ProfileSectionSkeleton,
  PurchasesSectionSkeleton,
  PurchaseSummarySkeleton,
  SavedSectionSkeleton,
} from "@/components/account/AccountSectionSkeletons";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { useSavedRaces } from "@/components/SavedRacesProvider";
import { signOut } from "@/lib/auth";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import {
  DEFAULT_PROFILE_COVER,
  PROFILE_COVER_PRESETS,
  resolveProfileCover,
} from "@/lib/profileCovers";
import { createClient } from "@/lib/supabase/client";
import { BASE_DOMAIN } from "@/lib/races";
import { isMxState } from "@/lib/mxStates";
import { classifyPurchasePayment, dedupePurchases } from "@/lib/purchasePayments";
import type { AthleteReview } from "@/lib/eventReviews";
import { normalizeUsername, usernameError } from "@/lib/usernames";
import {
  digTicketString,
  formatTicketDateParts,
  formatTicketLugar,
  ticketDownloadUrl,
  ticketQrSrc,
  type TicketAccessPayload,
} from "@/lib/ticketAccess";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Profile = {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  preferred_shirt_size: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio?: string | null;
  residence?: string | null;
  featured_medal_keys?: string[] | null;
  created_at?: string | null;
};

type Purchase = {
  id: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  dynamic_data?: Record<string, unknown>;
  event_name?: string | null;
  event_available?: boolean;
  event_unavailable?: boolean;
  race_event_id?: string | null;
  race_event?: {
    id?: string;
    name?: string;
    public_subdomain?: string | null;
    cover_image_url?: string | null;
    event_date?: string | null;
    city?: string | null;
    country?: string | null;
    available?: boolean;
    medal_image_url?: string | null;
    routes?: Array<{
      key?: string;
      label?: string;
      medal_image_url?: string | null;
      medal_label?: string | null;
    }> | null;
  } | null;
};

type EventMeta = {
  organizerLogo: string | null;
  organizerName: string | null;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  ig: string | null;
  web: string | null;
};

type TabId = "historial" | "guardados" | "perfil";

export default function CuentaPage() {
  const { user, loading, refresh: refreshAuth, patchProfile } = useAthleteAuth();
  const { items: savedItems, ready: savedReady, refresh: refreshSaved } = useSavedRaces();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabId =
    tabParam === "guardados" || tabParam === "perfil" || tabParam === "historial"
      ? tabParam
      : "perfil";
  const [tab, setTab] = useState<TabId>(initialTab);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [reviews, setReviews] = useState<AthleteReview[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<EditProfileDraft | null>(null);
  const [raceMedalIndex, setRaceMedalIndex] = useState<
    Record<string, { url: string; label: string }[]>
  >({});
  const [eventMetaIndex, setEventMetaIndex] = useState<Record<string, EventMeta>>({});
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseListItem | null>(null);
  const [accountDataReady, setAccountDataReady] = useState(false);
  const [sectionGate, setSectionGate] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tabParam === "guardados" || tabParam === "perfil" || tabParam === "historial") {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setSectionGate(false);
    const t = window.setTimeout(() => setSectionGate(true), 320);
    return () => window.clearTimeout(t);
  }, [tab]);

  useEffect(() => {
    if (tab === "guardados") {
      void refreshSaved();
    }
  }, [tab, refreshSaved]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?next=/cuenta");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const meta = user.user_metadata || {};
    const supabase = createClient();
    (async () => {
      const [{ data: prof }, { data: regs }, { data: reviewRows }] = await Promise.all([
        supabase.from("athlete_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.rpc("athlete_my_registrations"),
        supabase.rpc("athlete_my_reviews"),
      ]);
      const nextProfile: Profile =
        (prof as Profile) || {
          username: typeof meta.username === "string" ? meta.username : null,
          first_name: (meta.first_name as string) || null,
          last_name: (meta.last_name as string) || null,
          phone: null,
          gender: null,
          birth_date: null,
          preferred_shirt_size: null,
          avatar_url: (meta.avatar_url as string) || null,
          cover_url: null,
          bio: typeof meta.bio === "string" ? meta.bio : null,
          residence: typeof meta.residence === "string" ? meta.residence : null,
        };
      if (!nextProfile.bio && typeof meta.bio === "string") {
        nextProfile.bio = meta.bio;
      }
      if (!nextProfile.residence && typeof meta.residence === "string") {
        nextProfile.residence = meta.residence;
      }
      if (!nextProfile.first_name && typeof meta.first_name === "string") {
        nextProfile.first_name = meta.first_name;
      }
      if (!nextProfile.last_name && typeof meta.last_name === "string") {
        nextProfile.last_name = meta.last_name;
      }
      const metaKeys = meta.featured_medal_keys;
      if (
        (!nextProfile.featured_medal_keys || !Array.isArray(nextProfile.featured_medal_keys)) &&
        Array.isArray(metaKeys)
      ) {
        nextProfile.featured_medal_keys = metaKeys.map(String);
      }
      if (!isAthleteOnboarded(meta, nextProfile)) {
        router.replace("/onboarding?next=/cuenta");
        return;
      }
      setProfile(nextProfile);
      setPurchases(Array.isArray(regs) ? (regs as unknown as Purchase[]) : []);
      setReviews(Array.isArray(reviewRows) ? (reviewRows as unknown as AthleteReview[]) : []);
      setAccountDataReady(true);
    })();
    // Only reload when the signed-in user changes — not on every metadata updateUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, router]);

  const displayName = useMemo(() => {
    const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
    if (full) return full;
    return (
      (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      user?.email ||
      "Atleta"
    );
  }, [profile, user]);

  const coverSrc = resolveProfileCover(profile?.cover_url);

  async function persistCover(cover_url: string) {
    if (!user) return;
    setProfile((prev) => (prev ? { ...prev, cover_url } : prev));
    const supabase = createClient();
    const { data: current } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    const { error } = await supabase.from("athlete_profiles").upsert({
      ...(current || {}),
      user_id: user.id,
      cover_url,
      updated_at: new Date().toISOString(),
    });
    if (error) setMsg(error.message);
  }

  async function persistAvatar(avatar_url: string) {
    if (!user) return;
    setProfile((prev) => (prev ? { ...prev, avatar_url } : prev));
    patchProfile({ avatarUrl: avatar_url });
    const supabase = createClient();
    const { data: current } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    const { error } = await supabase.from("athlete_profiles").upsert({
      ...(current || {}),
      user_id: user.id,
      avatar_url,
      updated_at: new Date().toISOString(),
    });
    await supabase.auth.updateUser({
      data: { avatar_url, picture: avatar_url },
    });
    await refreshAuth();
    if (error) setMsg(error.message);
  }

  async function uploadAthleteImage(file: File, kind: "avatar" | "cover") {
    if (!user) return;
    const previewUrl = kind === "cover" ? URL.createObjectURL(file) : null;
    if (previewUrl) setCoverPreviewUrl(previewUrl);
    setUploading(true);
    setMsg(null);
    try {
      const webp = await convertImageToWebP(file, kind, { square: kind === "avatar", quality: kind === "avatar" ? 0.9 : undefined });
      const supabase = createClient();
      const path = `athletes/${user.id}-${kind}-${Date.now()}.webp`;
      const { error } = await supabase.storage.from("public-image").upload(path, webp, {
        upsert: true,
        contentType: "image/webp",
      });
      if (error) {
        setMsg(error.message);
        return;
      }
      const { data } = supabase.storage.from("public-image").getPublicUrl(path);
      if (kind === "avatar") {
        await persistAvatar(data.publicUrl);
      } else {
        await persistCover(data.publicUrl);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (previewUrl) {
        setCoverPreviewUrl(null);
        URL.revokeObjectURL(previewUrl);
      }
    }
  }

  useEffect(() => {
    if (tab !== "historial") setSelectedPurchase(null);
  }, [tab]);

  useEffect(() => {
    if (purchases.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "https://portal.dorsalia.run/sites/v1/public-events?status=all&limit=200",
        );
        if (!res.ok) return;
        const data = await res.json();
        const events = Array.isArray(data.events) ? data.events : [];
        const medalIndex: Record<string, { url: string; label: string }[]> = {};
        const metaIndex: Record<string, EventMeta> = {};
        for (const ev of events) {
          const id = String(ev?.id || "");
          if (!id) continue;
          const sub = String(ev?.public_subdomain || "").trim();
          const meta: EventMeta = {
            organizerLogo:
              String(ev?.organizer_logo_url || ev?.logo_url || "").trim() || null,
            organizerName: String(ev?.organizer_name || "").trim() || null,
            coverUrl: String(ev?.cover_image_url || "").trim() || null,
            city: String(ev?.city || "").trim() || null,
            country: String(ev?.country || "").trim() || null,
            venue: String(ev?.venue_name || "").trim() || null,
            ig: String(ev?.instagram_handle || "").replace(/^@/, "").trim() || null,
            web:
              String(ev?.website_url || "")
                .replace(/^https?:\/\//, "")
                .replace(/\/$/, "")
                .trim() || null,
          };
          metaIndex[id] = meta;
          if (sub) metaIndex[`sub:${sub}`] = meta;

          const routes = Array.isArray(ev.routes) ? ev.routes : [];
          const medals: { url: string; label: string }[] = [];
          for (const r of routes) {
            const url = String(r?.medal_image_url || "").trim();
            if (!url) continue;
            medals.push({
              url,
              label: String(r?.medal_label || r?.label || "Medalla").trim() || "Medalla",
            });
          }
          if (medals.length) {
            medalIndex[id] = medals;
            if (sub) medalIndex[`sub:${sub}`] = medals;
          }
        }
        if (!cancelled) {
          setRaceMedalIndex(medalIndex);
          setEventMetaIndex(metaIndex);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [purchases]);

  const profileMedals = useMemo(() => {
    const now = Date.now();
    const out: {
      key: string;
      label: string;
      imageUrl: string;
      completed: boolean;
    }[] = [];
    const seen = new Set<string>();

    for (const p of purchases) {
      const ev = p.race_event;
      const eventDateRaw = ev?.event_date;
      const eventTime = eventDateRaw ? new Date(eventDateRaw).getTime() : NaN;
      const completed = Number.isFinite(eventTime) ? eventTime < now : false;

      const dd = p.dynamic_data || {};
      const distancia = String(dd.distancia || dd.distance || dd.modalidad || "")
        .trim()
        .toLowerCase();

      const fromIndex =
        (ev?.id && raceMedalIndex[ev.id]) ||
        (ev?.public_subdomain && raceMedalIndex[`sub:${ev.public_subdomain}`]) ||
        [];

      let picked =
        fromIndex.find((m) => distancia && m.label.toLowerCase().includes(distancia)) ||
        fromIndex[0] ||
        null;

      if (!picked) {
        const routes = Array.isArray(ev?.routes) ? ev.routes : [];
        const matched =
          routes.find((r) => {
            const label = String(r.label || r.medal_label || "").toLowerCase();
            return distancia && label.includes(distancia);
          }) || routes.find((r) => Boolean(r.medal_image_url));
        const url = String(matched?.medal_image_url || ev?.medal_image_url || "").trim();
        if (url) {
          picked = {
            url,
            label: String(matched?.medal_label || matched?.label || distancia || "Medalla"),
          };
        }
      }

      if (!picked?.url) continue;
      const key = `${p.id}-${picked.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        label: picked.label,
        imageUrl: picked.url,
        completed,
      });
    }
    if (user?.user_metadata?.dorsalia_first_event_badge === true) {
      out.unshift({
        key: "dorsalia-first-event",
        label: "Primer evento en Dorsalia",
        imageUrl: "/assetsdev/primer-evento-dorsalia.webp",
        completed: true,
      });
    }
    return out;
  }, [purchases, raceMedalIndex, user?.user_metadata?.dorsalia_first_event_badge]);

  const featuredMedalKeys = useMemo(() => {
    const fromProfile = profile?.featured_medal_keys;
    const storedKeys = Array.isArray(fromProfile) && fromProfile.length
      ? fromProfile.map(String)
      : Array.isArray(user?.user_metadata?.featured_medal_keys)
        ? user.user_metadata.featured_medal_keys.map(String)
        : [];
    if (user?.user_metadata?.dorsalia_first_event_badge === true) {
      return ["dorsalia-first-event", ...storedKeys.filter((key) => key !== "dorsalia-first-event")].slice(0, MAX_FEATURED_MEDALS);
    }
    if (storedKeys.length) return storedKeys;
    return null;
  }, [profile, user]);

  const displayedMedals = useMemo(() => {
    if (!featuredMedalKeys) return profileMedals.slice(0, MAX_FEATURED_MEDALS);
    const byKey = new Map(profileMedals.map((m) => [m.key, m]));
    return featuredMedalKeys
      .map((k) => byKey.get(k))
      .filter((m): m is (typeof profileMedals)[number] => Boolean(m))
      .slice(0, MAX_FEATURED_MEDALS);
  }, [featuredMedalKeys, profileMedals]);

  const profileBio =
    profile?.bio ||
    (typeof user?.user_metadata?.bio === "string" ? user.user_metadata.bio : null);

  const purchaseItems = useMemo<PurchaseListItem[]>(() => {
    const candidates = purchases.map((p) => ({
      id: p.id,
      raceEventId: p.race_event?.id || p.race_event_id || null,
      createdAt: p.created_at || null,
      dynamicData: (p.dynamic_data || {}) as Record<string, unknown>,
      raw: p,
    }));

    const unique = dedupePurchases(candidates, (dd) => classifyPurchasePayment(dd));

    return unique.map(({ raw: p, dynamicData: dd }) => {
      const payment = classifyPurchasePayment(dd);
      const ev = p.race_event;
      const meta =
        (ev?.id && eventMetaIndex[ev.id]) ||
        (ev?.public_subdomain && eventMetaIndex[`sub:${ev.public_subdomain}`]) ||
        null;
      const available = p.event_available !== false && ev?.available !== false && Boolean(ev?.id);
      const eventHref =
        available && ev?.public_subdomain
          ? `https://${ev.public_subdomain}.${BASE_DOMAIN}`
          : null;
      const eventTitle =
        String(ev?.name || p.event_name || dd.event_name || "Carrera").trim() || "Carrera";

      const folio = digTicketString(dd, ["folio_asignado", "folio", "folio_code"]);
      const paidOk = payment.kind === "paid" || payment.kind === "free";
      let ticket: PurchaseListItem["ticket"] = null;
      if (paidOk && folio) {
        const { fecha, hora } = formatTicketDateParts(ev?.event_date || null);
        const nombre =
          digTicketString(dd, ["runner_name", "nombre_completo", "full_name"]) ||
          [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
          "Atleta";
        const distancia =
          digTicketString(dd, ["distancia", "distance", "modalidad"]) || "N/A";
        const tallaRaw = digTicketString(dd, ["talla_playera", "talla", "shirt_size"]);
        const talla = tallaRaw ? tallaRaw.toUpperCase() : "N/A";
        const dorsal =
          digTicketString(dd, ["dorsal", "dorsal_number", "bib_number"]) || null;
        const lugar =
          formatTicketLugar(meta?.venue, ev?.city || meta?.city, ev?.country || meta?.country) ||
          null;
        const courtesy =
          dd.courtesy === true ||
          dd.cortesia === true ||
          String(dd.is_courtesy || "").toLowerCase() === "true" ||
          (payment.kind === "free" && Number(dd.price_paid ?? 0) <= 0);
        const payload: TicketAccessPayload = {
          folio,
          nombre,
          distancia,
          talla,
          dorsal,
          eventName: eventTitle,
          logoUrl: meta?.organizerLogo || null,
          ig: meta?.ig || null,
          web: meta?.web || null,
          courtesy,
          fecha,
          hora,
          lugar,
        };
        ticket = {
          folio,
          nombre,
          distancia,
          talla,
          dorsal,
          fecha,
          hora,
          lugar,
          courtesy,
          qrSrc: ticketQrSrc(folio),
          downloadHref: ticketDownloadUrl(eventHref, payload),
        };
      }

      return {
        id: p.id,
        eventTitle,
        purchaseAt: p.created_at || null,
        priceLabel: payment.priceLabel,
        statusLabel: payment.statusLabel,
        organizerLogo: meta?.organizerLogo || null,
        organizerName: meta?.organizerName || null,
        coverUrl: (available ? ev?.cover_image_url : null) || meta?.coverUrl || null,
        eventDate: ev?.event_date || null,
        city: ev?.city || meta?.city || null,
        country: ev?.country || meta?.country || null,
        eventHref,
        ticket,
      };
    });
  }, [purchases, eventMetaIndex]);

  if (loading || !user) {
    if (tab === "guardados") return <SavedSectionSkeleton />;
    if (tab === "historial") return <PurchasesSectionSkeleton />;
    return <ProfileSectionSkeleton />;
  }

  const sectionDataReady =
    tab === "perfil"
      ? accountDataReady && Boolean(profile)
      : tab === "guardados"
        ? savedReady
        : accountDataReady;
  const showSectionSkeleton = !sectionGate || !sectionDataReady;

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  function openEditProfile() {
    if (!profile) return;
    const keys =
      featuredMedalKeys && featuredMedalKeys.length
        ? featuredMedalKeys.slice(0, MAX_FEATURED_MEDALS)
        : profileMedals.slice(0, MAX_FEATURED_MEDALS).map((m) => m.key);
    setEditDraft({
      username: profile.username || "",
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      bio: String(profileBio || "").slice(0, 150),
      phone: profile.phone || "",
      gender: profile.gender || "",
      birth_date: profile.birth_date || "",
      preferred_shirt_size: profile.preferred_shirt_size || "",
      residence: profile.residence || "",
      featuredMedalKeys: keys,
    });
    setEditOpen(true);
  }

  async function saveEditProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !editDraft) return;
    setSaving(true);
    setMsg(null);

    const first_name = editDraft.first_name.trim().slice(0, 30);
    const last_name = editDraft.last_name.trim().slice(0, 30);
    if (!first_name) {
      setSaving(false);
      setMsg("El nombre es obligatorio.");
      return;
    }
    const username = normalizeUsername(editDraft.username);
    const invalidUsername = usernameError(username);
    if (invalidUsername) {
      setSaving(false);
      setMsg(invalidUsername);
      return;
    }
    const supabase = createClient();
    const { data: usernameIsAvailable, error: usernameCheckError } = await supabase.rpc("username_available", { p_username: username });
    if (usernameCheckError || usernameIsAvailable !== true) {
      setSaving(false);
      setMsg("Ese username ya no está disponible. Elige otro.");
      return;
    }
    const bio = editDraft.bio.trim().slice(0, 150);
    const residenceRaw = editDraft.residence.trim();
    const residence = isMxState(residenceRaw) ? residenceRaw : "";
    const featured_medal_keys = editDraft.featuredMedalKeys.slice(0, MAX_FEATURED_MEDALS);
    const full_name = [first_name, last_name].filter(Boolean).join(" ");

    const next: Profile = {
      ...profile,
      username,
      first_name,
      last_name: last_name || null,
      phone: editDraft.phone.trim() || null,
      gender: editDraft.gender || null,
      birth_date: editDraft.birth_date || null,
      preferred_shirt_size: editDraft.preferred_shirt_size || null,
      bio,
      residence: residence || null,
      featured_medal_keys,
    };
    setProfile(next);
    patchProfile({
      firstName: next.first_name,
      lastName: next.last_name,
      avatarUrl: next.avatar_url,
      fullName: full_name,
    });

    const { data: current } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    const payload = {
      ...(current || {}),
      user_id: user.id,
      username,
      first_name: next.first_name,
      last_name: next.last_name,
      phone: next.phone,
      gender: next.gender,
      birth_date: next.birth_date,
      preferred_shirt_size: next.preferred_shirt_size,
      avatar_url: next.avatar_url,
      cover_url: next.cover_url,
      bio,
      residence: next.residence,
      featured_medal_keys,
      updated_at: new Date().toISOString(),
    };
    let { error } = await supabase.from("athlete_profiles").upsert(payload);
    if (error) {
      const soft = { ...payload } as Record<string, unknown>;
      delete soft.featured_medal_keys;
      delete soft.bio;
      delete soft.residence;
      ({ error } = await supabase.from("athlete_profiles").upsert(soft));
    }
    await supabase.auth.updateUser({
      data: {
        athlete_onboarding_done: true,
        first_name: next.first_name,
        last_name: next.last_name,
        full_name,
        username,
        bio,
        residence: next.residence,
        featured_medal_keys,
        avatar_url: next.avatar_url,
        picture: next.avatar_url,
      },
    });
    await refreshAuth();
    setSaving(false);
    if (error && !/bio|featured_medal|residence/i.test(error.message)) {
      setMsg(error.message);
      return;
    }
    setEditOpen(false);
    setEditDraft(null);
    setMsg("Perfil actualizado.");
  }

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-[#070707] pb-16">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void uploadAthleteImage(f, "avatar");
        }}
      />

      {tab === "perfil" ? (
        showSectionSkeleton ? (
          <ProfileSectionSkeleton />
        ) : (
          <div key="perfil" className="mp-section-enter">
            <AccountProfileView
              displayName={displayName}
              userId={user?.id}
              username={profile?.username || null}
              avatarUrl={profile?.avatar_url || null}
              coverSrc={coverSrc}
              bio={profileBio}
              medals={displayedMedals}
              reviews={reviews}
              onEdit={openEditProfile}
              onLogout={() => {
                void handleLogout();
              }}
              onAvatarClick={openEditProfile}
            />
            {msg ? <p className="px-5 text-center text-sm text-white/60">{msg}</p> : null}
            {uploading ? (
              <p className="px-5 text-center text-sm text-white/50">Convirtiendo a WebP…</p>
            ) : null}
          </div>
        )
      ) : null}

      {tab === "historial" ? (
        showSectionSkeleton ? (
          selectedPurchase ? <PurchaseSummarySkeleton /> : <PurchasesSectionSkeleton />
        ) : selectedPurchase ? (
          <div key={`resumen-${selectedPurchase.id}`} className="mp-section-enter">
            <PurchaseSummary
              item={selectedPurchase}
              onBack={() => setSelectedPurchase(null)}
            />
          </div>
        ) : (
          <section key="historial" className="min-h-screen bg-[#070707] pb-8 mp-section-enter">
            <AccountSubpageHeader title="Mis compras" />
            <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 24 }}>
              <PurchasesList
                items={purchaseItems}
                onOpen={(item) => setSelectedPurchase(item)}
              />
            </div>
          </section>
        )
      ) : null}

      {tab === "guardados" ? (
        showSectionSkeleton ? (
          <SavedSectionSkeleton />
        ) : (
          <section key="guardados" className="min-h-screen bg-[#070707] pb-8 mp-section-enter">
            <AccountSubpageHeader title="Guardados" />
            <div style={{ marginTop: 24 }}>
              <SavedRacesView
                items={savedItems}
                ready={savedReady}
                residence={
                  isMxState(profile?.residence || "")
                    ? profile!.residence!
                    : profile?.residence || null
                }
              />
            </div>
          </section>
        )
      ) : null}

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void uploadAthleteImage(f, "cover");
        }}
      />

      {editOpen && editDraft && profile ? (
        <EditProfileSheet
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditDraft(null);
          }}
          draft={editDraft}
          onChange={setEditDraft}
          availableMedals={profileMedals}
          coverSrc={coverSrc}
          coverPreviewUrl={coverPreviewUrl}
          avatarUrl={profile.avatar_url}
          uploading={uploading}
          saving={saving}
          onSave={(e) => {
            void saveEditProfile(e);
          }}
          onPickCoverPreset={(coverUrl) => {
            void persistCover(coverUrl);
          }}
          onUploadCover={() => coverInputRef.current?.click()}
          onUploadAvatar={() => avatarInputRef.current?.click()}
          canResetCover={Boolean(
            profile.cover_url && profile.cover_url !== DEFAULT_PROFILE_COVER,
          )}
          onResetCover={() => {
            void persistCover(`preset:${PROFILE_COVER_PRESETS[0].id}`);
          }}
        />
      ) : null}
    </div>
  );
}
