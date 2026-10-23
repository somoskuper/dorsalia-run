import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

export type ButtonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  href?: string;
  className?: string;
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  /** Open external links in a new tab when `href` is absolute. */
  external?: boolean;
  /** Stretch to full container width (forms). */
  fullWidth?: boolean;
  "aria-label"?: string;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "ds-btn ds-btn--primary",
  secondary: "ds-btn ds-btn--secondary",
  tertiary: "ds-btn ds-btn--tertiary",
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("//");
}

/**
 * Dorsalia marketplace buttons.
 * Height comes only from font-size (1rem) + padding — never set a fixed px height.
 */
export default function Button({
  variant = "primary",
  children,
  href,
  className = "",
  disabled = false,
  type = "button",
  onClick,
  external,
  fullWidth = false,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = [
    VARIANT_CLASS[variant],
    fullWidth ? "ds-btn--full" : "",
    disabled ? "ds-btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href && !disabled) {
    if (isExternalHref(href)) {
      return (
        <a
          href={href}
          className={classes}
          rel="noopener noreferrer"
          target={external ? "_blank" : undefined}
          aria-label={ariaLabel}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="secondary" />;
}

export function TertiaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="tertiary" />;
}
