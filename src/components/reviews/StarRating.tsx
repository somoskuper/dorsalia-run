"use client";

import AssetIcon from "@/components/ui/AssetIcon";

export function StarIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return <AssetIcon name={filled ? "star-solid" : "star-stroke"} size={size} className={filled ? "text-[#c9f24b]" : "text-white/25"} />;
}

export default function StarRating({
  value,
  onChange,
  size = 22,
  label = "Calificación",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${label}: ${value || 0} de 5`}>
      {[1, 2, 3, 4, 5].map((star) =>
        onChange ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c9f24b]"
            aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          >
            <StarIcon filled={star <= rounded} size={size} />
          </button>
        ) : (
          <StarIcon key={star} filled={star <= rounded} size={size} />
        ),
      )}
    </div>
  );
}

