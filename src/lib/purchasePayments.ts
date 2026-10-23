/** Helpers to decide which athlete registrations show in “Mis compras”. */

function digString(dd: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = dd[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Stripe Checkout / PaymentIntent created in test mode. */
export function isStripeTestPayment(dd: Record<string, unknown>): boolean {
  const blob = [
    digString(dd, [
      "stripe_checkout_session_id",
      "checkout_session_id",
      "stripe_session_id",
      "session_id",
    ]),
    digString(dd, [
      "stripe_payment_intent_id",
      "payment_intent_id",
      "payment_intent",
    ]),
    digString(dd, ["stripe_charge_id", "charge_id"]),
  ].join(" ");
  return /\b(cs_test_|pi_test_|ch_test_)/i.test(blob);
}

export type PurchasePaymentKind = "free" | "paid" | "awaiting" | "hidden";

export function classifyPurchasePayment(dd: Record<string, unknown>): {
  kind: PurchasePaymentKind;
  priceNum: number;
  statusLabel: string;
  priceLabel: string;
} {
  const priceRaw = dd.price_paid ?? dd.amount_charged ?? dd.total ?? dd.price;
  const priceNum = priceRaw != null ? Number(priceRaw) : NaN;
  const free = Number.isFinite(priceNum) && priceNum <= 0;
  const status = String(dd.payment_status || "")
    .trim()
    .toLowerCase();
  const hasFolio = Boolean(
    digString(dd, ["folio_asignado", "folio", "folio_code"]) ||
      dd.folio_asignado != null,
  );

  const formatPrice = (n: number) =>
    n <= 0
      ? "Gratis"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0,
        }).format(n);

  // Ignore Stripe test-mode checkouts / intents.
  if (isStripeTestPayment(dd)) {
    return { kind: "hidden", priceNum, statusLabel: "", priceLabel: "" };
  }

  // Transferencia con comprobante: visible en la cuenta, pero todavía no es venta.
  // Sin comprobante sigue siendo solo un intento y no se muestra.
  const paymentMethod = digString(dd, ["payment_method", "payment_method_type"]).toLowerCase();
  const hasTransferReceipt = Boolean(
    digString(dd, ["payment_receipt_url", "receipt_url", "receipt_path"]),
  );
  if (status === "pending_verification" && paymentMethod === "bank_transfer") {
    if (!hasTransferReceipt) {
      return { kind: "hidden", priceNum, statusLabel: "", priceLabel: "" };
    }
    return {
      kind: "awaiting",
      priceNum: Number.isFinite(priceNum) ? priceNum : 0,
      statusLabel: "Esperando aprobación",
      priceLabel: Number.isFinite(priceNum) ? formatPrice(priceNum) : "—",
    };
  }

  // Folio assigned ⇒ registration completed even if status lagging.
  if (hasFolio && (status === "awaiting_payment" || status === "pending_verification" || !status)) {
    if (free) {
      return { kind: "free", priceNum: 0, statusLabel: "Pago exitoso", priceLabel: "Gratis" };
    }
    return {
      kind: "paid",
      priceNum: Number.isFinite(priceNum) ? priceNum : NaN,
      statusLabel: "Pago exitoso",
      priceLabel: Number.isFinite(priceNum) ? formatPrice(priceNum) : "—",
    };
  }

  // Confirmed free registration.
  if (free && (status === "verified" || status === "paid" || status === "" || hasFolio)) {
    return {
      kind: "free",
      priceNum: 0,
      statusLabel: "Pago exitoso",
      priceLabel: "Gratis",
    };
  }

  // Confirmed live / real paid registration.
  if (status === "verified" || status === "paid") {
    return {
      kind: "paid",
      priceNum: Number.isFinite(priceNum) ? priceNum : NaN,
      statusLabel: "Pago exitoso",
      priceLabel: Number.isFinite(priceNum) ? formatPrice(priceNum) : "—",
    };
  }

  // OXXO / async cash: only show when voucher is actually pending
  // (not when the athlete merely opened Stripe Checkout to browse).
  if (status === "awaiting_payment") {
    const oxxoPending = isOxxoPending(dd);
    if (!oxxoPending) {
      return { kind: "hidden", priceNum, statusLabel: "", priceLabel: "" };
    }
    return {
      kind: "awaiting",
      priceNum: Number.isFinite(priceNum) ? priceNum : 0,
      statusLabel: "Esperando pago",
      priceLabel: Number.isFinite(priceNum) ? formatPrice(priceNum) : "—",
    };
  }

  // pending_verification, failed, cancelled, refunded, unknown → hide
  return { kind: "hidden", priceNum, statusLabel: "", priceLabel: "" };
}

/** True when the athlete finished Checkout with an unpaid OXXO voucher. */
function isOxxoPending(dd: Record<string, unknown>): boolean {
  if (dd.oxxo_pending === true || dd.async_payment_pending === true) return true;
  const flags = [
    digString(dd, ["oxxo_pending", "async_payment", "pending_method", "payment_method_type"]),
    digString(dd, ["stripe_payment_method_types", "payment_method"]),
  ]
    .join(" ")
    .toLowerCase();
  if (/\boxxo\b/.test(flags) && (dd.oxxo_pending === true || /pending|voucher|unpaid/.test(flags))) {
    return true;
  }
  // Explicit voucher / reference stored after Checkout complete + unpaid
  if (digString(dd, ["oxxo_reference", "oxxo_voucher_url", "oxxo_number"])) return true;
  return false;
}

export type DedupPurchaseInput = {
  id: string;
  raceEventId: string | null;
  createdAt: string | null;
  dynamicData: Record<string, unknown>;
};

/**
 * One row per inscription/transaction:
 * prefer payment_group_id, else race_event_id, else lead id.
 * When duplicates exist, keep the strongest status (paid/free > awaiting).
 */
export function dedupePurchases<T extends DedupPurchaseInput>(
  rows: T[],
  classify: (dd: Record<string, unknown>) => { kind: PurchasePaymentKind },
): T[] {
  const rank = (kind: PurchasePaymentKind) => {
    if (kind === "paid" || kind === "free") return 3;
    if (kind === "awaiting") return 2;
    return 0;
  };

  const best = new Map<string, { row: T; score: number; created: number }>();

  for (const row of rows) {
    const dd = row.dynamicData;
    const classified = classify(dd);
    if (classified.kind === "hidden") continue;

    const group = digString(dd, ["payment_group_id", "paymentGroupId"]);
    const key =
      group ||
      (row.raceEventId ? `event:${row.raceEventId}` : "") ||
      `lead:${row.id}`;

    const created = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    const score = rank(classified.kind) * 1e15 + created;
    const prev = best.get(key);
    if (!prev || score > prev.score) {
      best.set(key, { row, score, created });
    }
  }

  return [...best.values()]
    .sort((a, b) => b.created - a.created)
    .map((x) => x.row);
}
