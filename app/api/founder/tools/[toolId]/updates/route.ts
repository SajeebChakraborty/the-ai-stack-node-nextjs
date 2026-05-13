import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const updateSchema = z.object({
  body: z.string().trim().min(20),
  title: z.string().trim().min(4).max(140)
});

type Context = {
  params: Promise<{ toolId: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { toolId } = await context.params;
  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a title and update body." }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({
    where: {
      id: toolId
    },
    select: {
      founderId: true
    }
  });

  if (!tool) {
    return NextResponse.json({ error: "Tool not found." }, { status: 404 });
  }

  if (user.role !== "admin" && tool.founderId !== user.id) {
    return NextResponse.json({ error: "Only the claiming founder can publish listing updates." }, { status: 403 });
  }

  const update = await prisma.toolUpdate.create({
    data: {
      toolId,
      authorId: user.id,
      title: payload.data.title,
      body: payload.data.body,
      publishedAt: new Date()
    }
  });

  return NextResponse.json({
    id: update.id,
    message: "Founder update published."
  });
}
