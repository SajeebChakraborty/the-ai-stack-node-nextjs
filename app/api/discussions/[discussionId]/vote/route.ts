import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const voteSchema = z.object({
  vote: z.union([z.literal(1), z.literal(-1)])
});

type Context = {
  params: Promise<{ discussionId: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before voting on discussions." }, { status: 401 });
  }

  if (!["user", "founder", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Your account cannot vote on discussions." }, { status: 403 });
  }

  const { discussionId } = await context.params;
  const payload = voteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Vote must be either 1 or -1." }, { status: 400 });
  }

  const discussion = await prisma.discussion.findUnique({
    where: {
      id: discussionId
    },
    include: {
      tool: {
        select: {
          founderId: true
        }
      }
    }
  });

  if (!discussion?.toolId) {
    return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
  }

  if (discussion.tool?.founderId === user.id) {
    return NextResponse.json({ error: "Founders cannot vote on discussions attached to their own listing." }, { status: 403 });
  }

  const existingVote = await prisma.discussionVote.findUnique({
    where: {
      discussionId_userId: {
        discussionId,
        userId: user.id
      }
    }
  });

  if (!existingVote) {
    await prisma.discussionVote.create({
      data: {
        discussionId,
        userId: user.id,
        vote: payload.data.vote
      }
    });
  } else if (existingVote.vote === payload.data.vote) {
    await prisma.discussionVote.delete({
      where: {
        discussionId_userId: {
          discussionId,
          userId: user.id
        }
      }
    });
  } else {
    await prisma.discussionVote.update({
      where: {
        discussionId_userId: {
          discussionId,
          userId: user.id
        }
      },
      data: {
        vote: payload.data.vote
      }
    });
  }

  const aggregate = await prisma.discussionVote.aggregate({
    where: {
      discussionId
    },
    _sum: {
      vote: true
    }
  });

  const voteScore = aggregate._sum.vote ?? 0;

  await prisma.discussion.update({
    where: {
      id: discussionId
    },
    data: {
      voteScore
    }
  });

  return NextResponse.json({
    voteScore
  });
}
