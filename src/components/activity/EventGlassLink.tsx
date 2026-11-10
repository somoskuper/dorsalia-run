import Link from "next/link";
import GlassPanel from "@/components/ui/GlassPanel";

export default function EventGlassLink({ href, label = "Ver evento", external = false }: { href: string; label?: string; external?: boolean }) {
  const width = label.length > 10 ? 136 : 112;
  const className = "grid h-full w-full place-items-center rounded-full bg-white text-[13px] font-semibold";
  return <GlassPanel radius={999} className="shrink-0" style={{ width, height: 36, flex: `0 0 ${width}px` }} glassProps={{ glassColor: "rgba(255,255,255,0.96)", borderColor: "rgba(255,255,255,0.9)", blur: 16, frost: 0, saturation: 100, aberrationIntensity: 0 }}>
    {external
      ? <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={{ color: "#0E0E0E" }}>{label}</a>
      : <Link href={href} className={className} style={{ color: "#0E0E0E" }}>{label}</Link>}
  </GlassPanel>;
}
