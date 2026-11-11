import Image from "next/image";
import { avatarThumb, isGoogleAvatar } from "@/lib/avatarImage";

/** Feed-sized avatar. Google is requested already cropped; stored photos are resized by the image optimizer. */
export default function AvatarImage({ src, size, className = "object-cover" }: { src: string; size: number; className?: string }) {
  const url = avatarThumb(src, size * 3) || src;
  if (isGoogleAvatar(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" width={size} height={size} decoding="async" loading="lazy" referrerPolicy="no-referrer" className={className} />
    );
  }
  return <Image src={url} alt="" width={size} height={size} quality={75} sizes={`${size}px`} className={className} style={{ width: size, height: size }} />;
}
