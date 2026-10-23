import type { CSSProperties } from "react";

export type AssetIconName =
  | "heart-stroke"
  | "heart-solid"
  | "calendar"
  | "share"
  | "search"
  | "location"
  | "star-stroke"
  | "star-solid"
  | "home-stroke"
  | "home-2"
  | "ticket-stroke"
  | "ticket-solid"
  | "user-stroke"
  | "Verify-stroke"
  | "Verify-solid"
  | "edit-solid"
  | "arrow-circle-right"
  | "arrow-circle-left"
  | "eventos"
  | "feed"
  | "user-actividad-tab";

export default function AssetIcon({
  name,
  size = 24,
  className,
}: {
  name: AssetIconName;
  size?: number;
  className?: string;
}) {
  const mask = `url("/assetsdev/${name}.svg")`;
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: "currentColor",
    maskImage: mask,
    WebkitMaskImage: mask,
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  };
  return <span aria-hidden="true" className={`inline-block shrink-0 ${className || ""}`} style={style} />;
}
