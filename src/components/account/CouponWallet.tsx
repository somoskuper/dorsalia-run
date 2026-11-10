"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import GlassPanel from "@/components/ui/GlassPanel";
import { claimCouponByFolio, fetchMyCoupons, type AthleteCoupon } from "@/lib/athleteCoupons";
import { Bone } from "@/components/ui/Skeleton";

const GLASS = { glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 };

export function CouponHeader({ backHref = "/cuenta?tab=perfil", actionHref = "/miscompras?vista=compras", actionLabel = "Ver mis compras" }: { backHref?: string; actionHref?: string; actionLabel?: string }) {
  return <div className="flex items-center justify-between gap-3">
    <GlassIconButton aria-label="Volver" onClick={() => window.location.assign(backHref)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" width={24} height={24} />
    </GlassIconButton>
    <GlassPanel radius={999} className="w-fit flex-none" style={{ height: 44, width: "fit-content" }} glassProps={GLASS}>
      <Link href={actionHref} className="flex h-full w-fit items-center justify-center whitespace-nowrap px-[20px] text-[16px] font-medium text-white">{actionLabel}</Link>
    </GlassPanel>
  </div>;
}

export function CouponCard({ coupon, interactive = true }: { coupon: AthleteCoupon; interactive?: boolean }) {
  const status = coupon.status === "available" ? (coupon.button_label || "Canjear") : coupon.status === "redeemed" ? "Canjeado" : coupon.status === "expired" ? "Vencido" : "No disponible";
  return <article className="relative grid min-h-[162px] overflow-hidden rounded-[24px] text-white" style={{ backgroundColor: coupon.background_color, color: coupon.text_color || "#ffffff", gridTemplateColumns: "min(135px, 37.2%) minmax(0, 1fr)" }}>
    <div className="flex items-center justify-center pl-[20px] pr-[14px]">
      {coupon.logo_url ? /* eslint-disable-next-line @next/next/no-img-element */<img src={coupon.logo_url} alt={coupon.merchant_name} width={99} height={99} className="max-w-full object-contain" /> : <span className="text-center text-[16px] font-bold">{coupon.merchant_name}</span>}
    </div>
    <div className="absolute bottom-0 left-[min(135px,37.2%)] top-0 overflow-hidden" style={{ width: 3 }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/coupons/separator.svg" alt="" width={162} height={3} style={{ position: "absolute", transform: "rotate(90deg)", transformOrigin: "0 0", left: 3, top: 0, maxWidth: "none" }} />
    </div>
    <div className="flex min-w-0 flex-col items-start gap-[6px] py-[20px] pl-[25px] pr-[20px]">
      <h2 className="text-[20px] font-bold leading-[24px]">{coupon.title}</h2>
      <p className="text-[14px] leading-[16px]">{coupon.description}</p>
      {interactive ? <Link href={`/miscompras/cupones/${coupon.id}`} style={{ color: coupon.button_text_color || "#070707", backgroundColor: coupon.button_background_color || "#ffffff" }} className="relative z-[1] mt-auto inline-flex min-h-[46px] min-w-[122px] max-w-full items-center justify-center whitespace-normal break-words rounded-full text-center px-[17px] py-[8px] text-[16px] font-bold leading-[19px]">{status}</Link> : null}
      <p style={{color:coupon.text_color || "#ffffff",opacity:0.55}} className="text-[7px] leading-[12px]">{coupon.is_test ? "Cupón de prueba · " : ""}Aplican TyC, consulta la vigencia.</p>
    </div>
  </article>;
}

export default function CouponWallet({ userId }: { userId: string }) {
  const [coupons, setCoupons] = useState<AthleteCoupon[]>([]);
  const [tab, setTab] = useState<"available" | "expired">("available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [folio,setFolio]=useState("");const [claimBusy,setClaimBusy]=useState(false);const [claimError,setClaimError]=useState("");const [claimNotice,setClaimNotice]=useState("");
  async function claim(e:FormEvent){e.preventDefault();setClaimBusy(true);setClaimError("");setClaimNotice("");try{const result=await claimCouponByFolio(folio);setCoupons(prev=>[result.coupon,...prev.filter(c=>c.id!==result.coupon.id)]);setTab(result.coupon.status==="available"?"available":"expired");setFolio("");setClaimNotice(result.already_owned?"Este cupón ya está en tu lista.":"Cupón agregado a tus disponibles.");}catch(e){setClaimError(e instanceof Error?e.message:"No pudimos obtener el cupón.");}finally{setClaimBusy(false);}}

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setCoupons([]);
    fetchMyCoupons().then((rows) => { if (active) setCoupons(rows); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, retry]);
  const visible = coupons.filter((coupon) => tab === "available" ? coupon.status === "available" && Date.parse(coupon.expires_at) > Date.now() : coupon.status !== "available" || Date.parse(coupon.expires_at) <= Date.now());
  return <section className="mx-auto min-h-screen max-w-3xl bg-[#0e0e0e] px-[15px] pb-28 text-white">
    <div className="sticky top-0 lg:top-[63px] z-30 -mx-[15px] bg-[#0e0e0e] px-[15px] pb-3 pt-[15px]">
      <CouponHeader />
      <h1 className="mt-[28px] text-[32px] font-bold leading-[38px]">Cupones</h1>
      <div role="tablist" aria-label="Estado de cupones" className="mt-[24px] flex">
        {([{ id: "available", label: "Disponibles", icon: "ticket-available" }, { id: "expired", label: "Vencidos", icon: "ticket-expired" }] as const).map((item) => <button key={item.id} id={`coupon-tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="coupon-list" type="button" onClick={() => setTab(item.id)} className={`flex w-1/2 items-center justify-center gap-[5px] border-b-2 pb-[14px] text-[16px] ${tab === item.id ? "border-[#c5e500]" : "border-transparent"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/coupons/${item.icon}.svg`} alt="" width={24} height={24} />{item.label}
        </button>)}
      </div>
    </div>
    <form onSubmit={claim} className="mt-5 space-y-2">
      <label htmlFor="coupon-claim-folio" className="block text-[14px] text-white/70">¿Tienes un folio de cupón?</label>
      <div className="flex flex-wrap gap-2"><input id="coupon-claim-folio" required maxLength={48} value={folio} onChange={e=>setFolio(e.target.value.toUpperCase())} autoComplete="off" autoCapitalize="characters" placeholder="Ingresa el folio" className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-[16px] text-white"/><button type="submit" disabled={claimBusy||!folio.trim()} style={{backgroundColor:"#c9f24b",color:"#070707"}} className="rounded-full px-5 py-3 text-[15px] font-semibold disabled:opacity-50">{claimBusy?"Agregando…":"Obtener cupón"}</button></div>
      {claimError&&<p role="alert" className="text-[13px] text-red-300">{claimError}</p>}{claimNotice&&<p role="status" className="text-[13px] text-[#c9f24b]">{claimNotice}</p>}
    </form>
    <div id="coupon-list" role="tabpanel" aria-labelledby={`coupon-tab-${tab}`} className="mt-[22px] flex flex-col gap-[14px]" aria-busy={loading}>
      {loading ? <div className="flex flex-col gap-3 pt-2" role="status" aria-busy="true" aria-label="Cargando tus cupones">{[0, 1, 2].map((i) => <Bone key={i} style={{ height: 120, borderRadius: 20 }} />)}</div> : error ? <div role="alert" className="py-8 text-center"><p>{error}</p><button type="button" onClick={() => setRetry((n) => n + 1)} className="mt-4 underline">Intentar de nuevo</button></div> : visible.length ? visible.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />) : <p className="py-12 text-center text-[14px] leading-6 text-white/50">{tab === "available" ? "Aún no tienes cupones disponibles. Aquí aparecerán tus beneficios por participar en eventos." : "Aquí aparecerán tus cupones vencidos o canjeados."}</p>}
    </div>
  </section>;
}
