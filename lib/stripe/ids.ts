/** Stripe resource ids use a random alphanumeric suffix, not slug-style names. */
export function isRealStripeProductId(id: string | null | undefined) {
  if (!id?.startsWith("prod_")) {
    return false;
  }

  const suffix = id.slice(5);
  return /^[A-Za-z0-9]{14,}$/.test(suffix);
}

export function isRealStripePriceId(id: string | null | undefined) {
  if (!id?.startsWith("price_")) {
    return false;
  }

  const suffix = id.slice(6);
  return /^[A-Za-z0-9]{14,}$/.test(suffix);
}

export function normalizeStripeId(id: string | null | undefined, kind: "product" | "price") {
  if (!id) {
    return "";
  }

  return kind === "product"
    ? isRealStripeProductId(id)
      ? id
      : ""
    : isRealStripePriceId(id)
      ? id
      : "";
}
