import type { PublicRace } from "@/lib/races";
import AssetIcon from "@/components/ui/AssetIcon";

/**
 * Native Dorsalia events have an active collection setup. A claimed organizer
 * is still shown as verified, but intentionally with the neutral badge.
 */
export default function OrganizerVerificationBadge({
  race,
  className = "",
}: {
  race: Pick<PublicRace, "listing_type" | "organizer_is_provisional">;
  className?: string;
}) {
  const hasActivePayments = race.listing_type === "native";
  const isClaimed = !race.organizer_is_provisional;

  if (!hasActivePayments && !isClaimed) return null;

  const label = hasActivePayments
    ? "Organizador con pagos activos en Dorsalia"
    : "Cuenta verificada o reclamada";

  return (
    <span role="img" aria-label={label} title={label} className={`inline-flex ${hasActivePayments ? "text-[#c9f24b]" : "text-white/55"} ${className}`.trim()}>
      <AssetIcon name={hasActivePayments ? "Verify-solid" : "Verify-stroke"} size={12} />
    </span>
  );
}
