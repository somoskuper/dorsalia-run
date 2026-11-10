"use client";

import PageHeader from "@/components/PageHeader";
import ShareButton from "@/components/ShareButton";

export default function ReviewPageHeader({ fallbackHref = "/" }: { fallbackHref?: string }) {
  return <PageHeader fallbackHref={fallbackHref} sticky gradient={false} trailingLink={{ href: "/mis-resenas", label: "Mis reseñas" }} rightAction={<span className="ml-3"><ShareButton /></span>} />;
}
