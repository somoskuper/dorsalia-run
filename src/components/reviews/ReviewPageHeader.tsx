"use client";

import PageHeader from "@/components/PageHeader";

export default function ReviewPageHeader({ fallbackHref = "/" }: { fallbackHref?: string }) {
  return <PageHeader fallbackHref={fallbackHref} trailingLink={{ href: "/mis-resenas", label: "Mis reseñas" }} />;
}
