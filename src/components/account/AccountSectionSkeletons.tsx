"use client";

import { Bone, PostSkeleton } from "@/components/ui/Skeleton";

/** Shimmer skeletons for cuenta sections while content mounts. */

export function ProfileSectionSkeleton({ ownProfile = true }: { ownProfile?: boolean }) {
  return (
    <div className="relative min-h-screen bg-[#070707] pb-24 md:pb-16" aria-busy="true" aria-label="Cargando perfil">
      <Bone className="absolute inset-x-0 top-0 rounded-none" style={{ height: 210.5 }} />
      <div className="relative z-10 flex h-[84px] items-center justify-between px-[15px]">
        <span className="h-11 w-11 rounded-full bg-black/40" />
        {ownProfile ? <div className="flex gap-2">{Array.from({ length: 3 }, (_, i) => <span key={i} className="h-11 w-11 rounded-full bg-black/40" />)}</div> : null}
      </div>
      <div className="relative mx-auto mt-[50px] flex max-w-5xl flex-col items-center px-[15px]">
        <div className="grid h-[153px] w-[153px] place-items-center rounded-[47px] border-4 border-[#070707] bg-[#070707]">
          <Bone className="h-[145px] w-[145px] rounded-[43px]" />
        </div>
        <Bone className="mt-[14px]" style={{ width: 200, height: 32, borderRadius: 10 }} />
        <Bone className="mt-2" style={{ width: 110, height: 16, borderRadius: 6 }} />
        <div className="mt-5 grid w-full grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={`flex flex-col items-center ${i > 0 ? "border-l border-white/20" : ""}`}>
              <Bone style={{ width: 44, height: 32, borderRadius: 8 }} />
              <Bone className="mt-2" style={{ width: 72, height: 13, borderRadius: 5 }} />
            </div>
          ))}
        </div>
        <Bone className="mt-5 w-full" style={{ height: 56, borderRadius: 999 }} />
        <Bone className="mt-[14px]" style={{ width: 210, height: 16, borderRadius: 6 }} />
        <Bone className="mt-10 w-full" style={{ height: 150, borderRadius: 20 }} />
      </div>
      <section className="mt-10">
        <Bone className="mx-[15px]" style={{ width: 100, height: 24, borderRadius: 8 }} />
        <div className="mt-[10px]"><PostSkeleton count={1} /></div>
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
