import { createClient } from "@/lib/supabase/client";

export type AthleteCoupon = {
  id: string;
  code: string;
  text_color: string;
  button_background_color: string;
  button_text_color: string;
  button_label: string;
  uses_total: number;
  uses_used: number;
  uses_remaining: number;
  campaign_id: string;
  merchant_name: string;
  title: string;
  detail_title: string;
  detail_description: string;
  gallery_urls: string[];
  social_links: Record<string, string>;
  description: string;
  terms: string;
  logo_url: string | null;
  background_color: string;
  benefit_type: "percent" | "amount" | "gift" | "other";
  benefit_value: number | null;
  is_test: boolean;
  issued_at: string;
  expires_at: string;
  redeemed_at: string | null;
  status: "available" | "expired" | "redeemed" | "revoked";
  grant_reason: string;
};

export async function fetchMyCoupons(): Promise<AthleteCoupon[]> {
  const { data, error } = await createClient().rpc("athlete_my_coupons");
  if (error) throw new Error("No pudimos cargar tus cupones. Intenta de nuevo.");
  return Array.isArray(data) ? data as AthleteCoupon[] : [];
}

export async function fetchMyCoupon(id: string): Promise<AthleteCoupon> {
  const { data, error } = await createClient().rpc("athlete_coupon_detail", { p_coupon_id: id });
  if (error || !data) throw new Error("Este cupón no está disponible en tu cuenta.");
  return data as AthleteCoupon;
}

export async function redeemMyCoupon(id: string, requestId: string): Promise<AthleteCoupon> {
  const { data, error } = await createClient().rpc("athlete_redeem_benefit_coupon", { p_coupon_id: id, p_request_id: requestId });
  if (error || !data) throw new Error(error?.code === "P0001" ? error.message : "No pudimos canjear el cupón. Intenta de nuevo.");
  return data as AthleteCoupon;
}

export async function claimCouponByFolio(folio: string): Promise<{coupon:AthleteCoupon;already_owned:boolean}> {
 const {data,error}=await createClient().rpc("athlete_claim_benefit_folio",{p_folio:folio.trim()});
 if(error)throw new Error(error.message||"No pudimos obtener el cupón.");
 if(data?.error||!data?.coupon)throw new Error(data?.error||"No pudimos obtener el cupón.");
 return data as {coupon:AthleteCoupon;already_owned:boolean};
}
