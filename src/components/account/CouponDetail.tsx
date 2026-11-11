"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import GlassIconButton from "@/components/account/GlassIconButton";
import GlassPanel from "@/components/ui/GlassPanel";
import { fetchMyCoupon, redeemMyCoupon, type AthleteCoupon } from "@/lib/athleteCoupons";
import { Bone } from "@/components/ui/Skeleton";

const SOCIALS = [
  { src: "/assetsdev/Social-Icons-4.svg", key: "facebook", label: "Facebook" },
  { src: "/assetsdev/Social-Icons-5.svg", key: "instagram", label: "Instagram" },
  { src: "/assetsdev/Social-Icons-3.svg", key: "tiktok", label: "TikTok" },
  { src: "/assetsdev/Social-Icons.svg", key: "whatsapp", label: "WhatsApp" },
];

const GLASS = { glassColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.32)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 };

function date(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Merida" }).format(new Date(value));
}

function CouponDetailHeader({ available, remaining, textColor }: { available: boolean; remaining: number; textColor: string }) {
  return <header className="sticky top-0 z-40 -mx-5 flex h-[72px] items-center justify-between gap-3 bg-transparent px-5 sm:-mx-6 sm:px-6">
    <GlassIconButton aria-label="Volver a mis cupones" onClick={() => window.location.assign("/miscompras")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<span aria-hidden="true" className="block h-6 w-6" style={{backgroundColor:textColor,mask:"url(/assetsdev/Chevron_Right.svg) center/contain no-repeat",WebkitMask:"url(/assetsdev/Chevron_Right.svg) center/contain no-repeat"}}/>
    </GlassIconButton>
    <GlassPanel radius={999} className="w-fit flex-none" style={{ height: 48, width: "fit-content" }} glassProps={GLASS}>
      <div style={{color:textColor}} className="flex h-full w-fit items-center justify-center whitespace-nowrap px-5 text-[16px] font-semibold">
        {available ? `${remaining} ${remaining === 1 ? "Uso disponible" : "Usos disponibles"}` : "Cupón utilizado"}
      </div>
    </GlassPanel>
  </header>;
}

export default function CouponDetail({ id }: { id: string }) {
  const { user, loading: authLoading } = useAthleteAuth();
  const router = useRouter();
  const [coupon, setCoupon] = useState<AthleteCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const redemptionRequest = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/auth?next=${encodeURIComponent(`/miscompras/cupones/${id}`)}`);
    if (!user) return;
    let active = true;
    setLoading(true); setError(""); setCoupon(null);
    fetchMyCoupon(id).then((row) => { if (active) setCoupon(row); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, user, authLoading, router]);

  async function redeem() {
    setBusy(true); setError("");
    try { redemptionRequest.current ||= crypto.randomUUID(); setCoupon(await redeemMyCoupon(id, redemptionRequest.current)); redemptionRequest.current = null; setConfirm(false); }
    catch (err) { setError(err instanceof Error ? err.message : "No pudimos completar el canje."); }
    finally { setBusy(false); }
  }

  const background = coupon?.background_color || "#070707";
  const textColor = coupon?.text_color || "#ffffff";
  const buttonColors = {backgroundColor:coupon?.button_background_color || "#ffffff",color:coupon?.button_text_color || "#070707"};
  const available = coupon?.status === "available" && Date.parse(coupon.expires_at) > Date.now();
  const detailTitle = coupon?.detail_title || (coupon?.benefit_type === "percent" && coupon.benefit_value
    ? `Obtén un ${Number(coupon.benefit_value)}% OFF en sucursal.`
    : coupon?.title);

  return <main className="min-h-[100svh] w-full text-white" style={{ backgroundColor: background, color: textColor, ["--coupon-background" as string]: background, marginTop: "calc(-1 * env(safe-area-inset-top, 0px))", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
    <section className="mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col px-5 pb-8 sm:px-6">
      <CouponDetailHeader available={Boolean(available)} remaining={coupon?.uses_remaining ?? 1} textColor={textColor} />
      {loading ? <div className="pt-6" role="status" aria-busy="true" aria-label="Cargando cupón"><Bone style={{ height: 220, borderRadius: 28 }} /><Bone className="mt-6" style={{ width: "70%", height: 24, borderRadius: 8 }} /><Bone className="mt-3" style={{ width: "90%", height: 14, borderRadius: 6 }} /><Bone className="mt-2" style={{ width: "60%", height: 14, borderRadius: 6 }} /></div> : coupon ? <>
        <div className="mt-10 flex min-h-[190px] items-center justify-center">
          {coupon.logo_url ? /* eslint-disable-next-line @next/next/no-img-element */<img src={coupon.logo_url} alt={coupon.merchant_name} width={240} height={190} className="max-h-[190px] w-[240px] object-contain" /> : <p className="text-center text-[30px] font-bold">{coupon.merchant_name}</p>}
        </div>

        <div className="mt-7">
          <h1 className="text-[32px] font-bold leading-[1.12]">{detailTitle}</h1>
          <p className="mt-[10px] text-[16px] leading-[20px]">{coupon.detail_description || coupon.description}</p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-2" aria-label="Fotos del cupón">
          {(coupon.gallery_urls || []).map((src) => <div key={src} className="aspect-[0.82] overflow-hidden rounded-[15px] bg-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={`Foto de ${coupon.merchant_name}`} width={240} height={292} className="h-full w-full object-cover" />
          </div>)}
        </div>

        <div className="mt-6 flex justify-center">
          {available ? confirm ? <div className="w-full max-w-[320px] rounded-[30px] border border-white/30 bg-black/10 p-4 text-center backdrop-blur-md" role="group" aria-label="Confirmar canje">
            <p className="text-[15px] font-medium">¿Usar este cupón ahora?</p>
            <p style={{opacity:0.75}} className="mt-1 text-[12px]">Al confirmar se descontará un uso de tu cupón.</p>
            <div className="mt-3 flex justify-center gap-3">
              <button type="button" onClick={() => void redeem()} disabled={busy} style={buttonColors} className="min-h-[48px] rounded-full px-6 text-[16px] font-semibold disabled:opacity-60">{busy ? "Canjeando…" : "Confirmar canje"}</button>
              <button type="button" disabled={busy} onClick={() => setConfirm(false)} style={{color:textColor}} className="min-h-[48px] px-3 text-[14px] font-medium">Cancelar</button>
            </div>
          </div> : <button type="button" onClick={() => setConfirm(true)} style={buttonColors} className="h-[58px] w-full max-w-[254px] rounded-full px-8 text-[16px] font-bold transition-opacity hover:opacity-90">{coupon.button_label || "Canjear"}</button> : <p role="status" className="rounded-full border border-white/35 bg-white/10 px-7 py-4 text-center text-[16px] font-semibold">{coupon.status === "redeemed" ? `Canjeado el ${date(coupon.redeemed_at!)}` : coupon.status === "revoked" ? "Cupón no disponible" : "Cupón vencido"}</p>}
        </div>

        <p style={{color:textColor,opacity:0.6}} className="mx-auto mt-3 max-w-[330px] text-center text-[9px] leading-[12px]">{coupon.is_test ? "Cupón de prueba. No representa una promoción autorizada por el comercio. " : ""}{coupon.terms}</p>

        <footer className="mt-auto flex justify-center gap-6 pt-8" aria-label="Redes sociales">
          {SOCIALS.filter(social => /^https:\/\//.test(coupon.social_links?.[social.key] || "")).map((social) => <a key={social.label} href={coupon.social_links[social.key]} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex h-8 w-8 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}<span aria-hidden="true" className="block h-7 w-7" style={{backgroundColor:textColor,mask:`url(${social.src}) center/contain no-repeat`,WebkitMask:`url(${social.src}) center/contain no-repeat`}}/>
          </a>)}
        </footer>
      </> : null}
      {error ? <p role="alert" style={{color:textColor}} className="mt-5 text-center text-[14px]">{error}</p> : null}
    </section>
  </main>;
}
