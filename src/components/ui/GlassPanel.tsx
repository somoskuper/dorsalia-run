"use client";

import { forwardRef, type ReactNode, type CSSProperties } from "react";
import { LiquidGlass } from "simple-liquid-glass";
import type { LiquidGlassProps } from "simple-liquid-glass";

export type GlassVariant = "default" | "dark" | "light" | "crystal";

export interface GlassPanelProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: GlassVariant;
  radius?: number;
  /** Pass-through any LiquidGlass prop for full control. */
  glassProps?: Partial<LiquidGlassProps>;
}

const VARIANT_DEFAULTS: Record<
  GlassVariant,
  Partial<LiquidGlassProps>
> = {
  default: {
    material: "smoked",
    blur: 18,
    saturation: 130,
    frost: 0,
    glassColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.18)",
    aberrationIntensity: 0.04,
  },
  dark: {
    material: "smoked",
    blur: 22,
    saturation: 120,
    frost: 0,
    glassColor: "rgba(10,10,10,0.45)",
    borderColor: "rgba(255,255,255,0.12)",
    aberrationIntensity: 0.03,
  },
  light: {
    material: "frosted",
    blur: 14,
    saturation: 140,
    frost: 0,
    glassColor: "rgba(255,255,255,0.35)",
    borderColor: "rgba(255,255,255,0.45)",
    aberrationIntensity: 0.06,
  },
  crystal: {
    material: "clear",
    blur: 16,
    saturation: 140,
    frost: 0,
    glassColor: "rgba(18,18,18,0.28)",
    borderColor: "rgba(255,255,255,0.65)",
    aberrationIntensity: 0.08,
    border: 0.1,
  },
};

/**
 * Reusable liquid-glass wrapper. Renders Apple-style real refraction on
 * Chromium and a polished frosted-glass fallback on Safari / Firefox.
 *
 * Usage:
 *   <GlassPanel radius={20}>…content…</GlassPanel>
 *   <GlassPanel variant="dark" radius={18} style={{ width: 360 }}>…</GlassPanel>
 */
const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel(
    { children, className = "", style, variant = "default", radius = 20, glassProps },
    ref,
  ) {
    const defaults = VARIANT_DEFAULTS[variant];

    return (
      <LiquidGlass
        ref={ref as React.Ref<any>}
        radius={radius}
        {...defaults}
        {...glassProps}
        className={[variant === "crystal" ? "ds-glass-crystal" : "", className]
          .filter(Boolean)
          .join(" ")}
        style={style}
      >
        {children}
      </LiquidGlass>
    );
  },
);

export default GlassPanel;
