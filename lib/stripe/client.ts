import "server-only";

import Stripe from "stripe";
import { loadStripeSettings } from "@/lib/stripe/config";

export async function getStripe() {
  const { secretKey } = await loadStripeSettings();

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured. Add keys in Admin → Settings or STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true
  });
}

export async function isStripeConfigured() {
  const { configured } = await loadStripeSettings();
  return configured;
}
