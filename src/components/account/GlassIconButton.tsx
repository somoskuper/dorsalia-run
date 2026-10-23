"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import GlassPanel from "@/components/ui/GlassPanel";

type Props = {
  children: ReactNode;
  "aria-label": string;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "disabled" | "title">;

/**
 * Circular liquid-glass control.
 * Icon 24×24 + padding 10px all sides → 44×44 circle, fill 7%.
 */
export default function GlassIconButton({
  children,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: 44, height: 44, flex: "0 0 44px" }}
    >
      <GlassPanel
        radius={999}
        style={{ width: 44, height: 44 }}
        glassProps={{
          glassColor: "rgba(255,255,255,0.07)",
          borderColor: "rgba(255,255,255,0.25)",
          blur: 16,
          frost: 0,
          saturation: 130,
          aberrationIntensity: 0.02,
        }}
      >
        <button
          type={type}
          className="relative z-[1] grid place-items-center text-white"
          style={{ width: 44, height: 44, padding: 10, boxSizing: "border-box" }}
          {...rest}
        >
          <span className="pointer-events-none grid h-6 w-6 place-items-center overflow-hidden [&>img]:block [&>img]:h-6 [&>img]:w-6">
            {children}
          </span>
        </button>
      </GlassPanel>
    </div>
  );
}
