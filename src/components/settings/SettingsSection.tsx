import Link from "next/link";

const PENDING_HREF = "/settings/en-proceso";

export type SettingsLink = {
  label: string;
  icon?: string;
  iconSrc?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Visible, but the screen is not ready yet. */
  pending?: boolean;
};

function SettingsRow({ label, icon, iconSrc, href, onClick, disabled, pending }: SettingsLink) {
  const content = <>
    <span className="flex min-w-0 items-center gap-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc || `/settings-icons/${icon}`} alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </span>
    {disabled ? null : (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src="/settings-icons/Chevron_Right.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
    )}
  </>;
  const rowClass = `flex items-center justify-between gap-[10px] rounded-lg text-[16px] font-normal leading-6${pending ? " opacity-50" : ""}`;
  if (disabled) return <div className={`${rowClass} text-white/40`} aria-disabled="true">{content}</div>;
  if (pending) return <Link href={PENDING_HREF} className={`${rowClass} transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-[#c5e500]`} aria-label={`${label}. Estamos trabajando en ello`}>{content}</Link>;
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
