import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type Context = {
  params: Promise<{ toolId: string }>;
};

export async function POST(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can approve claimed listings." }, { status: 403 });
  }

  const { toolId } = await context.params;

  const tool = await prisma.tool.findUnique({
    where: {
      id: toolId
    },
    select: {
      id: true
    }
  });

  if (!tool) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  await prisma.tool.update({
    where: {
      id: toolId
    },
    data: {
      status: "published",
      verified: true
    }
  });

  return NextResponse.json({
    message: "Listing approved and now visible in the directory."
  });
}
