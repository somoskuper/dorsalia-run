import type { CSSProperties } from "react";

export function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`mp-skeleton-bone ${className}`} style={style} aria-hidden />;
}

export function SkeletonStatus({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className} role="status" aria-busy="true" aria-label={label}>{children}</div>;
}

export function PostSkeleton({ count = 2, media = true }: { count?: number; media?: boolean }) {
  return <SkeletonStatus label="Cargando publicaciones">
    {Array.from({ length: count }, (_, index) => <div key={index} className="border-b border-white/10 pb-5">
      <div className="flex items-center gap-3 px-[15px] py-5">
        <Bone className="h-[35px] w-[35px] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Bone style={{ width: "45%", height: 18, borderRadius: 8 }} />
          <Bone className="mt-2" style={{ width: 70, height: 10, borderRadius: 5 }} />
        </div>
      </div>
      {media ? <Bone className="aspect-[4/5] w-full rounded-none" /> : null}
      <div className="px-[15px]">
        <Bone className="mt-4" style={{ width: 120, height: 22, borderRadius: 8 }} />
        <Bone className="mt-3" style={{ width: "92%", height: 14, borderRadius: 6 }} />
        <Bone className="mt-2" style={{ width: "70%", height: 14, borderRadius: 6 }} />
      </div>
    </div>)}
  </SkeletonStatus>;
}

export function ListRowsSkeleton({ count = 5, avatar = "circle", label = "Cargando" }: { count?: number; avatar?: "circle" | "square" | "flyer"; label?: string }) {
  const media = avatar === "circle" ? "h-12 w-12 rounded-full" : avatar === "flyer" ? "h-20 w-16 rounded-xl" : "h-12 w-12 rounded-[14px]";
  return <SkeletonStatus label={label} className="flex flex-col">
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex items-center gap-3 px-[15px] py-3">
      <Bone className={`shrink-0 ${media}`} />
      <div className="min-w-0 flex-1">
        <Bone style={{ width: `${70 - (index % 3) * 12}%`, height: 16, borderRadius: 6 }} />
        <Bone className="mt-2" style={{ width: "40%", height: 10, borderRadius: 5 }} />
      </div>
    </div>)}
  </SkeletonStatus>;
}

export function CommentsSkeleton({ count = 3 }: { count?: number }) {
  return <SkeletonStatus label="Cargando comentarios">
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex gap-3 border-b border-white/15 py-4">
      <Bone className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Bone style={{ width: 120, height: 14, borderRadius: 6 }} />
        <Bone className="mt-2" style={{ width: `${88 - index * 14}%`, height: 12, borderRadius: 6 }} />
      </div>
    </div>)}
  </SkeletonStatus>;
}

export function PhotoGridSkeleton({ count = 6, columns = 2 }: { count?: number; columns?: 2 | 3 }) {
  return <SkeletonStatus label="Cargando fotos" className={`grid gap-[10px] ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
    {Array.from({ length: count }, (_, index) => <Bone key={index} className="aspect-square rounded-[20px]" />)}
  </SkeletonStatus>;
}

export function SettingsFieldsSkeleton({ count = 4 }: { count?: number }) {
  return <SkeletonStatus label="Cargando" className="mt-10 flex flex-col gap-[30px]">
    {Array.from({ length: count }, (_, index) => <div key={index}>
      <Bone style={{ width: 140, height: 22, borderRadius: 8 }} />
      <Bone className="mt-[10px]" style={{ width: "100%", height: 44, borderRadius: 20 }} />
    </div>)}
  </SkeletonStatus>;
}

export function EventCardsSkeleton({ count = 6 }: { count?: number }) {
  return <SkeletonStatus label="Cargando eventos" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, index) => <div key={index}>
      <div className="flex items-center gap-3 py-3">
        <Bone className="h-[35px] w-[35px] shrink-0 rounded-full" />
        <Bone style={{ width: "50%", height: 16, borderRadius: 6 }} />
      </div>
      <Bone className="aspect-[4/5] w-full rounded-[28px]" />
      <Bone className="mt-3" style={{ width: "80%", height: 18, borderRadius: 8 }} />
      <Bone className="mt-2" style={{ width: "45%", height: 12, borderRadius: 6 }} />
    </div>)}
  </SkeletonStatus>;
}

export function EventPhotoRailSkeleton({ className = "mt-[30px]" }: { className?: string }) {
  return <SkeletonStatus label="Cargando fotos" className={className}>
    <div className="mb-5 flex items-center justify-between px-[17px] lg:px-0">
      <Bone style={{ width: 210, height: 28, borderRadius: 8 }} />
      <Bone className="h-8 w-8 rounded-full" />
    </div>
    <div className="flex gap-[15px] overflow-hidden px-[17px] lg:px-0">
      {Array.from({ length: 2 }, (_, index) => <Bone key={index} className="aspect-[4/5] w-[250px] shrink-0 rounded-[15px]" />)}
    </div>
  </SkeletonStatus>;
}

export function ProfileGallerySkeleton() {
  return <div className="mt-5" role="status" aria-busy="true" aria-label="Cargando galería">
    <Bone className="mt-10" style={{ width: 110, height: 28, borderRadius: 8 }} />
    <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
      <Bone className="aspect-[4/5] rounded-[20px]" />
      <Bone className="aspect-square rounded-[20px]" />
    </div>
    <Bone className="mt-10" style={{ width: 180, height: 24, borderRadius: 8 }} />
    <div className="mt-[10px] flex gap-4 overflow-hidden">
      {Array.from({ length: 2 }, (_, index) => <Bone key={index} className="aspect-square w-[250px] shrink-0 rounded-[20px]" />)}
    </div>
  </div>;
}

export function MobileHomeSkeleton() {
  return <SkeletonStatus label="Cargando eventos" className="min-h-screen bg-[#0e0e0e] px-[17px] pb-24 pt-4">
    <Bone style={{ height: 46, borderRadius: 999 }} />
    <div className="mt-[28px] flex gap-[10px] overflow-hidden">{Array.from({ length: 4 }, (_, index) => <Bone key={index} className="shrink-0" style={{ width: 110, height: 44, borderRadius: 999 }} />)}</div>
    <Bone className="mt-[30px]" style={{ height: 200, borderRadius: 29 }} />
    <Bone className="mt-[30px]" style={{ width: 200, height: 28, borderRadius: 8 }} />
    <div className="mt-5 flex gap-[15px] overflow-hidden">{Array.from({ length: 2 }, (_, index) => <Bone key={index} className="shrink-0" style={{ width: 250, height: 250, borderRadius: 15 }} />)}</div>
  </SkeletonStatus>;
}

export function MarketplacePageSkeleton({ hero = true }: { hero?: boolean }) {
  return <div className="min-h-screen bg-[#070707]">
    <div className="lg:hidden"><MobileHomeSkeleton /></div>
    <SkeletonStatus label="Cargando" className="hidden px-5 pb-16 pt-[30px] lg:block">
      {hero ? <Bone style={{ height: 300, borderRadius: 28 }} /> : null}
      <Bone className="mt-[30px]" style={{ maxWidth: 560, height: 46, borderRadius: 999 }} />
      <div className="mt-5 flex gap-2">{Array.from({ length: 3 }, (_, index) => <Bone key={index} style={{ width: 120, height: 44, borderRadius: 20 }} />)}</div>
      <div className="mt-10"><EventCardsSkeleton /></div>
    </SkeletonStatus>
  </div>;
}

export function ListPageSkeleton({ label = "Cargando eventos" }: { label?: string }) {
  return <SkeletonStatus label={label} className="min-h-screen bg-[#070707] pb-24 pt-6">
    <div className="mx-auto max-w-7xl px-5">
      <Bone style={{ width: 240, height: 36, borderRadius: 10 }} />
      <Bone className="mt-6" style={{ maxWidth: 720, height: 46, borderRadius: 999 }} />
      <div className="mt-5 flex gap-2 overflow-hidden">{Array.from({ length: 4 }, (_, index) => <Bone key={index} className="shrink-0" style={{ width: 96, height: 36, borderRadius: 999 }} />)}</div>
    </div>
    <div className="mx-auto mt-6 max-w-7xl"><ListRowsSkeleton count={7} avatar="flyer" label={label} /></div>
  </SkeletonStatus>;
}

export function DetailPageSkeleton() {
  return <SkeletonStatus label="Cargando" className="min-h-screen bg-[#070707] px-[15px] pb-24 pt-5">
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between"><Bone className="h-11 w-11 rounded-full" /><Bone className="h-11 w-11 rounded-full" /></div>
      <div className="mt-8 flex flex-col items-center">
        <Bone style={{ width: 260, height: 260, borderRadius: 15 }} />
        <Bone className="mt-4" style={{ width: "70%", height: 28, borderRadius: 8 }} />
        <Bone className="mt-2" style={{ width: "45%", height: 16, borderRadius: 6 }} />
      </div>
      <Bone className="mt-6" style={{ height: 70, borderRadius: 16 }} />
      <div className="-mx-[15px] mt-6"><PostSkeleton count={1} /></div>
    </div>
  </SkeletonStatus>;
}
