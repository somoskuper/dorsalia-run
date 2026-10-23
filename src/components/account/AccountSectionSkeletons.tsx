"use client";

/** Shimmer skeletons for cuenta sections while content mounts. */

function Bone({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`mp-skeleton-bone ${className}`} style={style} aria-hidden />;
}

export function ProfileSectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#070707] pb-24 md:pb-16" aria-busy="true" aria-label="Cargando perfil">
      <div className="relative w-full" style={{ height: 221 }}>
        <Bone className="absolute inset-0 rounded-none" />
        <div
          className="absolute z-20 overflow-hidden rounded-full"
          style={{ top: 98, left: 20, width: 140, height: 140 }}
        >
          <Bone className="h-full w-full rounded-full" />
        </div>
      </div>
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 32 }}>
        <Bone style={{ width: "55%", height: 34, borderRadius: 10 }} />
        <Bone className="mt-3" style={{ width: "78%", height: 18, borderRadius: 8 }} />
        <Bone className="mt-2" style={{ width: "62%", height: 18, borderRadius: 8 }} />
      </div>
      <section style={{ paddingLeft: 20, paddingRight: 20, marginTop: 32 }}>
        <Bone style={{ width: 180, height: 24, borderRadius: 8 }} />
        <div className="mt-4 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function SavedSectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#070707] pb-8" aria-busy="true" aria-label="Cargando guardados">
      <div style={{ paddingTop: 15, paddingLeft: 20, paddingRight: 20 }}>
        <Bone style={{ width: 40, height: 40, borderRadius: 12 }} />
        <Bone className="mt-5" style={{ width: 160, height: 30, borderRadius: 10 }} />
      </div>
      <div style={{ marginTop: 28, paddingLeft: 20 }}>
        <Bone style={{ width: 120, height: 16, borderRadius: 6 }} />
        <div className="mt-3 flex gap-2.5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone
              key={i}
              style={{ width: 134, height: 167, borderRadius: 28, flexShrink: 0 }}
            />
          ))}
        </div>
        <Bone className="mt-6" style={{ width: 100, height: 16, borderRadius: 6 }} />
        <div className="mt-3 flex gap-2.5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone
              key={i}
              style={{ width: 134, height: 167, borderRadius: 28, flexShrink: 0 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PurchasesSectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#070707] pb-8" aria-busy="true" aria-label="Cargando compras">
      <div style={{ paddingTop: 15, paddingLeft: 20, paddingRight: 20 }}>
        <Bone style={{ width: 40, height: 40, borderRadius: 12 }} />
        <Bone className="mt-5" style={{ width: 180, height: 30, borderRadius: 10 }} />
      </div>
      <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 28 }} className="flex flex-col gap-[18px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center" style={{ gap: 12 }}>
            <Bone style={{ width: 40, height: 40, borderRadius: 999 }} />
            <div className="min-w-0 flex-1">
              <Bone style={{ width: "70%", height: 16, borderRadius: 6 }} />
              <Bone className="mt-2" style={{ width: "42%", height: 10, borderRadius: 5 }} />
            </div>
            <div className="shrink-0">
              <Bone style={{ width: 54, height: 10, borderRadius: 5, marginLeft: "auto" }} />
              <Bone className="mt-2" style={{ width: 64, height: 14, borderRadius: 6, marginLeft: "auto" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PurchaseSummarySkeleton() {
  return (
    <div className="min-h-screen bg-[#070707] pb-8" aria-busy="true" aria-label="Cargando resumen">
      <div style={{ paddingTop: 15, paddingLeft: 20, paddingRight: 20 }}>
        <Bone style={{ width: 40, height: 40, borderRadius: 12 }} />
        <Bone className="mt-5" style={{ width: 120, height: 28, borderRadius: 10 }} />
      </div>
      <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 24 }} className="flex gap-3.5">
        <Bone style={{ width: 110, height: 138, borderRadius: 28, flexShrink: 0 }} />
        <div className="min-w-0 flex-1">
          <Bone style={{ width: "85%", height: 18, borderRadius: 6 }} />
          <Bone className="mt-2" style={{ width: "45%", height: 10, borderRadius: 5 }} />
          <Bone className="mt-5" style={{ width: "70%", height: 14, borderRadius: 6 }} />
          <Bone className="mt-3" style={{ width: "55%", height: 14, borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 32 }}>
        <Bone style={{ width: "100%", height: 200, borderRadius: 20 }} />
      </div>
    </div>
  );
}
