import { fetchPublicRaces, MARKETPLACE_HOST, PORTAL_URL } from "@/lib/races";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const races = await fetchPublicRaces({ status: "all" });
  const base = `https://${MARKETPLACE_HOST}`;
  const links = races
    .filter((r) => r.site_url)
    .map((r) => `- [${r.name}](${r.site_url})${r.is_active ? "" : " (inactiva)"}`)
    .join("\n");

  const body = `# Carreras Dorsalia

> Índice público de eventos deportivos creados con Dorsalia.

Cada carrera tiene su propio subdominio. Este marketplace las enlaza para SEO y descubrimiento.

## Enlaces
- [Marketplace](${base}/)
- [Sitemap](${base}/sitemap.xml)
- [Portal organizadores](${PORTAL_URL})

## Carreras indexadas
${links || "- (aún no hay sitios públicos)"}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
