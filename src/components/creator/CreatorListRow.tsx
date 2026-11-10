import Link from "next/link";
import type { ReactNode } from "react";

/** Row used by the creator event picker and the collection folders. */
export default function CreatorListRow({ media, title, subtitle, trailing, href, onClick }: {
  media: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const content = <>
    {media}
    <span className="min-w-0 flex-1"><strong className="block truncate text-[16px] font-normal">{title}</strong>{subtitle ? <small className="text-white/50">{subtitle}</small> : null}</span>
    {trailing}
    {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/Chevron_Right.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
  </>;
  const className = "flex w-full items-center gap-3 py-5 text-left";
  return href ? <Link href={href} className={className}>{content}</Link> : <button type="button" onClick={onClick} className={className}>{content}</button>;
}

export function CreatorList({ children }: { children: ReactNode }) {
  return <div className="mt-8 divide-y divide-white/10">{children}</div>;
}
