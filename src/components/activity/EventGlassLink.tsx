import Link from "next/link";
import GlassPanel from "@/components/ui/GlassPanel";

export default function EventGlassLink({ href }: { href: string }) {
  return <GlassPanel radius={999} className="shrink-0" style={{ width: 112, height: 36, flex: "0 0 112px" }} glassProps={{ glassColor: "rgba(255,255,255,0.96)", borderColor: "rgba(255,255,255,0.9)", blur: 16, frost: 0, saturation: 100, aberrationIntensity: 0 }}>
    <Link href={href} className="grid h-full w-full place-items-center rounded-full bg-white text-[13px] font-semibold" style={{ color: "#0E0E0E" }}>Ver evento</Link>
  </GlassPanel>;
}
