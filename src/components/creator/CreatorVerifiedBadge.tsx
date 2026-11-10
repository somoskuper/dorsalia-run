export default function CreatorVerifiedBadge({ size = 16 }: { size?: number }) {
  return <span aria-label="Creador verificado" className="inline-block shrink-0" style={{ width: size, height: size, backgroundColor: "#C5E500", WebkitMask: "url(/settings-icons/creador-verificado.svg) center / contain no-repeat", mask: "url(/settings-icons/creador-verificado.svg) center / contain no-repeat" }} />;
}
