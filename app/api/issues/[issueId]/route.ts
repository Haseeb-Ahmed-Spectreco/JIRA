import { type NextRequest, NextResponse } from "next/server";
import { prisma, ratelimit } from "@/server/db";
import {
  type Issue,
  type DefaultUser,
} from "@prisma/client";
import { z } from "zod";
import { type GetIssuesResponse } from "../route";
import { clerkClient } from "@clerk/nextjs";
import { filterUserForClient } from "@/utils/helpers";
import { getAuth } from "@clerk/nextjs/server";
import { IssueStatus, IssueType } from "@/types/enum";
import { sendIssueUpdate} from "@/utils/emailService"

export type GetIssueDetailsResponse = {
  issue: GetIssuesResponse["issues"][number] | null;
};

export type PostIssueResponse = { issue: Issue };

export async function GET(
  req: NextRequest,
  { params }: { params: { issueId: string } }
) {
  const { issueId } = params;
  const issue = await prisma.issue.findUnique({
    where: {
      id: issueId,
    },
  });
  if (!issue?.parentId) {
    return NextResponse.json({ issue: { ...issue, parent: null } });
  }
  const parent = await prisma.issue.findUnique({
    where: {
      id: issue.parentId,
    },
  });
  // return NextResponse.json<GetIssueDetailsResponse>({ issue });
  return NextResponse.json({ issue: { ...issue, parent } });
}

const patchIssueBodyValidator = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(IssueType).optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  sprintPosition: z.number().optional(),
  boardPosition: z.number().optional(),
  imageUrl: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  reporterId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  isDeleted: z.boolean().optional(),
  sprintColor: z.string().optional(),
  skipEmailNotification: z.boolean().optional(),

});

export type PatchIssueBody = z.infer<typeof patchIssueBodyValidator>;
export type PatchIssueResponse = {
  issue: Issue & { assignee: DefaultUser | null };
};

type ParamsType = {
  params: {
    issueId: string;
  };
};

export async function PATCH(req: NextRequest, { params }: ParamsType) {
  const { userId } = getAuth(req);
  console.log("User ID patching issue: ", userId);
  if (!userId) return new Response("Unauthenticated request", { status: 403 });
  const { success } = await ratelimit.limit(userId);
  if (!success) return new Response("Too many requests", { status: 429 });
  const { issueId } = params;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body = await req.json();
  console.log("Issues Body: ", body)
  const validated = patchIssueBodyValidator.safeParse(body);
  console.log("Issues Validated: ", validated)
  if (!validated.success) {
    // eslint-disable-next-line
    const message = "Invalid body. " + validated.error.errors[0]?.message;
    return new Response(message, { status: 400 });
  }

  const { data: valid } = validated;

  const currentIssue = await prisma.issue.findUnique({
    where: {
      id: issueId,
    },
  });

  if (!currentIssue) {
    return new Response("Issue not found", { status: 404 });
  }

  const issue = await prisma.issue.update({
    where: {
      id: issueId,
    },
    data: {
      name: valid.name ?? undefined,
      description: valid.description ?? undefined,
      status: valid.status ?? undefined,
      type: valid.type ?? undefined,
      imageUrl: valid.imageUrl ?? undefined,
      sprintPosition: valid.sprintPosition ?? undefined,
      assigneeId: valid.assigneeId === undefined ? undefined : valid.assigneeId,
      reporterId: valid.reporterId ?? undefined,
      isDeleted: valid.isDeleted ?? undefined,
      sprintId: valid.sprintId === undefined ? undefined : valid.sprintId,
      parentId: valid.parentId === undefined ? undefined : valid.parentId,
      sprintColor: valid.sprintColor ?? undefined,
      boardPosition: valid.boardPosition ?? undefined,
    },
  });

  if (issue.assigneeId) {
    try {
      const assignee = await clerkClient.users.getUser(issue.assigneeId);
      const assigneeForClient = filterUserForClient(assignee);
      return NextResponse.json({
        issue: { ...issue, assignee: assigneeForClient },
      });
    } catch (error) {
      console.error("Error fetching assignee from Clerk: ", error);
      const assignee = await prisma.defaultUser.findUnique({
        where: {
          id: issue.assigneeId,
        },
      });
      if (assignee) {
        return NextResponse.json({
          issue: { ...issue, assignee },
        });
      }
      return new Response("Error fetching assignee", { status: 500 });
    }
  }


  const oldStatus = currentIssue.status
  const newStatus = valid?.status ?? issue.status

  console.log("status updated", oldStatus, newStatus)

  if (!valid.skipEmailNotification && oldStatus !== newStatus) {
          // Send email asynchronously to avoid blocking the response
          setImmediate(() => {
            void sendIssueUpdate(issue, oldStatus, newStatus, userId)
          });
        }
  

  // return NextResponse.json<PostIssueResponse>({ issue });
  return NextResponse.json({
    issue: { ...issue, assignee: null },
  });
}

export async function DELETE(req: NextRequest, { params }: ParamsType) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthenticated request", { status: 403 });
  const { success } = await ratelimit.limit(userId);
  if (!success) return new Response("Too many requests", { status: 429 });

  const { issueId } = params;

  const issue = await prisma.issue.update({
    where: {
      id: issueId,
    },
    data: {
      isDeleted: true,
      boardPosition: -1,
      sprintPosition: -1,
      sprintId: "DELETED-SPRINT-ID",
    },
  });

  // return NextResponse.json<PostIssueResponse>({ issue });
  return NextResponse.json({ issue });
}
