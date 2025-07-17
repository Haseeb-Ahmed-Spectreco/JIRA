import { prisma, ratelimit } from "@/server/db";
import { SprintStatus } from "@/types/enum";
import { getAuth } from "@clerk/nextjs/server";
import {  type Sprint } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export type PostSprintResponse = {
  sprint: Sprint;
};

export type GetSprintsResponse = {
  sprints: Sprint[];
};


export type PostSprintBody = z.infer<typeof postSprintBodyValidator>;

const postSprintBodyValidator = z.object({
  name: z.string().optional(),
  creatorId: z.string().optional(),
  status: z.string().optional(),
  description: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { data: PostSprintBody };

    const data = body.data;
   const validated = postSprintBodyValidator.safeParse(data);

   if (!validated.success) {
    console.log("Validation Error: ", validated.error);
    const message =
      "Invalid body. " + (validated.error.errors[0]?.message ?? "");
    return new Response(message, { status: 400 });
  }

    const { data: valid } = validated;


    const  userId  = valid.creatorId ?? "user_2PvBRngdvenUlFvQNAWbXIvYVy5";

  if (!userId) return new Response("Unauthenticated request", { status: 403 });
  const { success } = await ratelimit.limit(userId);
  if (!success) return new Response("Too many requests", { status: 429 });




  // Find the sprint to get its unique id
  const sprintToUpdate = await prisma.sprint.findFirst({
    where: { creatorId: userId },
  });

  if (!sprintToUpdate) {
     const sprint = await prisma.sprint.create({
    data: {
      name: valid.name ?? "SPRINT-UNKNOWN",
      description: valid.description ?? "",
      status: valid.status ?? "ACTIVE",
      creatorId: userId,
    },
  });
  // return NextResponse.json<PostSprintResponse>({ sprint });
  return NextResponse.json({ sprint });
  }

  const sprint = await prisma.sprint.update({
    where: { id: sprintToUpdate.id },
    data: {
      // Add fields to update here, e.g. name, description, status
      name: valid.name ?? sprintToUpdate.name,
      description: valid.description ?? sprintToUpdate.description,
      status: valid.status ?? sprintToUpdate.status,
    }
  });
  // return NextResponse.json<PostSprintResponse>({ sprint });
  return NextResponse.json({ sprint });
}


export async function GET(req: NextRequest) {
  const sprints = await prisma.sprint.findMany({
    where: {
      OR: [{ status: SprintStatus.ACTIVE }, { status: SprintStatus.PENDING }],
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // return NextResponse.json<GetSprintsResponse>({ sprints });
  return NextResponse.json({ sprints });
}
