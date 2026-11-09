import CouponDetail from "@/components/account/CouponDetail";

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CouponDetail id={id} />;
}
