"use client";

export default function SettingsSectionEdit({ title, value, onClick }: { title: string; value: string; onClick: () => void }) {
  return (
    <section aria-label={title}>
      <h2 className="text-[20px] font-semibold leading-[24px]">{title}</h2>
      <button type="button" onClick={onClick} className="mt-[10px] flex h-[44px] w-full items-center justify-between gap-[10px] rounded-[20px] bg-[#191919] pl-[15px] pr-[10px] text-left focus-visible:outline-2 focus-visible:outline-[#C5E500]">
        <span className="min-w-0 truncate text-[16px] text-white/50">{value || "Agregar"}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings-icons/Chevron_Right.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
      </button>
    </section>
  );
}
