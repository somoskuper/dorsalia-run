import Link from "next/link";

export type SettingsLink = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
};

function SettingsRow({ label, icon, href, onClick }: SettingsLink) {
  const content = <>
    <span className="flex min-w-0 items-center gap-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/settings-icons/${icon}`} alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
      <span>{label}</span>
    </span>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/settings-icons/Chevron_Right.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
  </>;
  const rowClass = "flex items-center justify-between gap-[10px] rounded-lg text-[16px] font-normal leading-6";
  return onClick ? <button type="button" onClick={onClick} className={`${rowClass} w-full text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-[#c5e500]`}>{content}</button>
    : href
    ? <Link href={href} className={`${rowClass} transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-[#c5e500]`}>{content}</Link>
    : <div className={rowClass}>{content}</div>;
}

export default function SettingsSection({ title, links }: { title: string; links: readonly SettingsLink[] }) {
  return (
    <section aria-label={title}>
      <h2 className="text-[20px] font-semibold leading-[24px]">{title}</h2>
      <nav aria-label={title} className="mt-[10px] rounded-[20px] bg-[#191919] py-[15px] pl-[15px] pr-[10px]">
        <ul className="flex flex-col gap-4">
          {links.map((item) => <li key={item.label}><SettingsRow {...item} /></li>)}
        </ul>
      </nav>
    </section>
  );
}
