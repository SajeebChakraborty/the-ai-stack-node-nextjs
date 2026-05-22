import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseMarketplaceSettings, splitCoursePurchase } from "@/lib/marketplace/settings";
import { loadStripeSettings } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";

const checkoutSchema = z.object({
  courseId: z.string().optional(),
  slug: z.string().optional()
});

function formatError(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) return error.message;
  if (error instanceof Error) return error.message;
  return "Could not start checkout.";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to buy this course." }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.courseId && !parsed.data.slug)) {
    return NextResponse.json({ error: "Course not provided." }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: {
      status: "published",
      ...(parsed.data.courseId ? { id: parsed.data.courseId } : { slug: parsed.data.slug })
    },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      thumbnailUrl: true,
      priceCents: true,
      currency: true,
      ownerId: true,
      owner: {
        select: {
          stripeAccountId: true,
          stripeAccountChargesEnabled: true
        }
      }
    }
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (course.ownerId === user.id) {
    return NextResponse.json({ error: "You cannot buy your own course." }, { status: 400 });
  }

  if (course.priceCents <= 0) {
    return NextResponse.json(
      { error: "This course is free. Use the Enroll button instead." },
      { status: 400 }
    );
  }

  const existingPurchase = await prisma.coursePurchase.findFirst({
    where: { courseId: course.id, buyerId: user.id },
    select: { id: true }
  });
  if (existingPurchase) {
    return NextResponse.json({ error: "You already own this course." }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = await getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Ask the admin to add API keys." },
      { status: 503 }
    );
  }

  const marketplace = await getCourseMarketplaceSettings();
  const { platformFeeCents, creatorEarningCents } = splitCoursePurchase(course.priceCents, marketplace.platformFeePercent);
  const billingSettings = await loadStripeSettings();
  const useAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
  const defaultTaxRateId = billingSettings.defaultTaxRateId.startsWith("txr_")
    ? billingSettings.defaultTaxRateId
    : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const usesConnect =
    Boolean(course.ownerId) &&
    Boolean(course.owner?.stripeAccountId) &&
    Boolean(course.owner?.stripeAccountChargesEnabled);

  if (course.ownerId && !usesConnect) {
    // Creator hasn't finished Stripe onboarding — don't block the buyer, but flag clearly.
    return NextResponse.json(
      {
        error:
          "The course creator hasn't finished setting up payouts yet. Please try again later or contact the creator."
      },
      { status: 503 }
    );
  }

  try {
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: course.currency || marketplace.currency,
        unit_amount: course.priceCents,
        product_data: {
          name: course.title,
          description: course.shortDescription,
          ...(course.thumbnailUrl ? { images: [course.thumbnailUrl] } : {})
        }
      }
    };

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [lineItem],
      allow_promotion_codes: true,
      metadata: {
        kind: "course_purchase",
        courseId: course.id,
        buyerId: user.id,
        platformFeeCents: String(platformFeeCents),
        creatorEarningCents: String(creatorEarningCents)
      },
      payment_intent_data: {
        metadata: {
          kind: "course_purchase",
          courseId: course.id,
          buyerId: user.id
        },
        ...(usesConnect && course.owner?.stripeAccountId
          ? {
              application_fee_amount: platformFeeCents,
              transfer_data: { destination: course.owner.stripeAccountId }
            }
          : {}),
        ...(defaultTaxRateId && !useAutomaticTax ? {} : {})
      },
      ...(useAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
      success_url: `${appUrl}/courses/${course.slug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/courses/${course.slug}?purchase=cancelled`
    };

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[courses/checkout]", formatError(error));
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}
