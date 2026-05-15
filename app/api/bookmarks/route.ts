import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const bookmarkSchema = z.object({
  toolId: z.string().min(1)
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ toolIds: [] });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    select: { toolId: true }
  });

  return NextResponse.json({ toolIds: bookmarks.map((bookmark) => bookmark.toolId) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to bookmark listings." }, { status: 401 });
  }

  const payload = bookmarkSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid bookmark request." }, { status: 400 });
  }

  await prisma.bookmark.upsert({
    where: {
      userId_toolId: {
        userId: user.id,
        toolId: payload.data.toolId
      }
    },
    update: {},
    create: {
      userId: user.id,
      toolId: payload.data.toolId
    }
  });

  return NextResponse.json({ message: "Listing bookmarked." });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage bookmarks." }, { status: 401 });
  }

  const payload = bookmarkSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid bookmark request." }, { status: 400 });
  }

  await prisma.bookmark.deleteMany({
    where: {
      userId: user.id,
      toolId: payload.data.toolId
    }
  });

  return NextResponse.json({ message: "Bookmark removed." });
}
