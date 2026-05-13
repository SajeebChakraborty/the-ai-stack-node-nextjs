import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeYoutubeEmbedUrl } from "@/lib/tools/media";

const mediaSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    altText: z.string().trim().min(3).max(140),
    title: z.string().trim().optional(),
    url: z.string().url()
  }),
  z.object({
    kind: z.literal("video"),
    duration: z.string().trim().min(2).max(20),
    title: z.string().trim().min(3).max(140),
    url: z.string().url()
  })
]);

type Context = {
  params: Promise<{ toolId: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { toolId } = await context.params;
  const payload = mediaSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid media URL and details." }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({
    where: {
      id: toolId
    },
    select: {
      slug: true,
      founderId: true
    }
  });

  if (!tool) {
    return NextResponse.json({ error: "Tool not found." }, { status: 404 });
  }

  if (user.role !== "admin" && tool.founderId !== user.id) {
    return NextResponse.json({ error: "Only the claiming founder can add listing media." }, { status: 403 });
  }

  const createdMedia = await prisma.mediaAsset.create({
    data: {
      ownerId: user.id,
      toolId,
      kind: payload.data.kind,
      bucket: "claimed-listings",
      path: `${tool.slug}/${payload.data.kind}/${Date.now()}`,
      publicUrl: payload.data.kind === "video" ? normalizeYoutubeEmbedUrl(payload.data.url) : payload.data.url,
      altText: payload.data.kind === "image" ? payload.data.altText : payload.data.title,
      metadata:
        payload.data.kind === "video"
          ? {
              title: payload.data.title,
              duration: payload.data.duration
            }
          : payload.data.title
            ? {
                title: payload.data.title
              }
            : undefined
    }
  });

  return NextResponse.json({
    id: createdMedia.id,
    message: payload.data.kind === "video" ? "Video added to the claimed listing." : "Image added to the claimed listing."
  });
}
