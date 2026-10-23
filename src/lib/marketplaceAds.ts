export type MarketplaceAdCard = {
  id: string;
  slug: string;
  image_url: string;
  image_alt: string;
  title: string;
  description: string;
  footer_primary: string;
  footer_secondary: string;
  cta_label: string;
  cta_url: string;
  background_color: string;
  sort_order: number;
  is_active: boolean;
};

export async function fetchMarketplaceAdCards(): Promise<MarketplaceAdCard[]> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run"}/rest/v1/rpc/get_marketplace_ad_cards`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const cards: unknown = await response.json();
    return Array.isArray(cards) ? cards as MarketplaceAdCard[] : [];
  } catch {
    return [];
  }
}
