import { type NextRequest, NextResponse } from "next/server";
import { prisma, ratelimit } from "@/server/db";
import {
  IssueType,
  type Issue,
  IssueStatus,
  type DefaultUser,
} from "@prisma/client";
import { z } from "zod";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import {
  calculateInsertPosition,
  filterUserForClient,
  generateIssuesForClient,
} from "@/utils/helpers";

const postIssuesBodyValidator = z.object({
  name: z.string(),
  type: z.enum(["BUG", "STORY", "TASK", "EPIC", "SUBTASK"]),
  assigneeId: z.string().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  sprintId: z.string().nullable(),
  reporterId: z.string().nullable(),
  parentId: z.string().nullable(),
  sprintColor: z.string().nullable().optional(),
  userId: z.string().nullable(),
  details: z.string().optional(),
});

export type PostIssueBody = z.infer<typeof postIssuesBodyValidator>;

const patchIssuesBodyValidator = z.object({
  ids: z.array(z.string()),
  type: z.nativeEnum(IssueType).optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  assigneeId: z.string().nullable().optional(),
  reporterId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  isDeleted: z.boolean().optional(),
});

export type PatchIssuesBody = z.infer<typeof patchIssuesBodyValidator>;

type IssueT = Issue & {
  children: IssueT[];
  sprintIsActive: boolean;
  parent: Issue & {
    sprintIsActive: boolean;
    children: IssueT[];
    parent: null;
    assignee: DefaultUser | null;
    reporter: DefaultUser | null;
  };
  assignee: DefaultUser | null;
  reporter: DefaultUser | null;
  userId: string | null;
};

export type GetIssuesResponse = {
  issues: IssueT[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  console.log("Issues Body: ", req);
  const userId = searchParams.get("userId");

  console.log("User ID to get Issues: ", userId);

  const whereIssue = userId
    ? { creatorId: userId, isDeleted: false }
    : { isDeleted: false };

  const totalIssues = await prisma.issue.findMany({
    where: whereIssue,
  });
  console.log("Total Issues: ", totalIssues, "Length: ", totalIssues.length);

  if (!totalIssues || totalIssues.length === 0) {
    return NextResponse.json({ issues: [] });
  }
  if (userId) {
    const limitFromQuery = searchParams.get("limit");
    const pageFromQuery = searchParams.get("page");
    const limit = limitFromQuery ? parseInt(limitFromQuery ?? "10") : false;
    const page = pageFromQuery ? parseInt(pageFromQuery ?? "1") : false;
    const offset = page && limit ? (page - 1) * limit : 0;

    const activeIssues = await prisma.issue.findMany({
      where: whereIssue,
      skip: offset,

      take: limit || undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeIssues || activeIssues.length === 0) {
      return NextResponse.json({ issues: [] });
    }

    console.log("Limit: ", limit, " Page: ", page);

    const activeSprints = await prisma.sprint.findMany({});
    const users = await prisma.defaultUser.findMany({
      where: {
        id: {
          in: [userId],
        },
      },
    });

    const issuesForClient = generateIssuesForClient(
      activeIssues,
      users,
      activeSprints.map((sprint) => sprint.id)
    );

    return NextResponse.json({
      issues: issuesForClient,
      total: totalIssues.length,
    });
  }

  const activeSprints = await prisma.sprint.findMany({});

  const userIds = totalIssues
    .flatMap((issue) => [issue.assigneeId, issue.reporterId] as string[])
    .filter(Boolean);

  const users = await prisma.defaultUser.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });

  const clerkUsers = (
    await clerkClient.users.getUserList({
      userId: userIds,
      limit: 10,
    })
  ).map(filterUserForClient);

  users.push(...clerkUsers);

  const issuesForClient = generateIssuesForClient(
    totalIssues,
    users,
    activeSprints.map((sprint) => sprint.id)
  );

  return NextResponse.json({ issues: issuesForClient });
}

// POST
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { data: PostIssueBody };

  const data = body.data;

  console.log("Issues Data coming: ", data);

  const validated = postIssuesBodyValidator.safeParse(data);

  if (!validated.success) {
    console.log("Validation Error: ", validated.error);
    const message =
      "Invalid body. " + (validated.error.errors[0]?.message ?? "");
    return new Response(message, { status: 400 });
  }

  const { data: valid } = validated;

  console.log("Validated Data: ", valid);

  const userId = valid?.userId ?? "user_2PvBRngdvenUlFvQNAWbXIvYVy5";

  const issues = await prisma.issue.findMany({});

  const currentSprintIssues = issues.filter(
    (issue) => issue.sprintId === valid.sprintId && issue.isDeleted === false
  );

  const sprint = await prisma.sprint.findUnique({
    where: {
      id: valid.sprintId ?? "",
    },
  });

  let boardPosition = -1;

  if (sprint && sprint.status === "ACTIVE") {
    // If issue is created in active sprint, add it to the bottom of the TODO column in board
    const issuesInColum = currentSprintIssues.filter(
      (issue) => issue.status === "TODO"
    );
    boardPosition = calculateInsertPosition(issuesInColum);
  }

  const k = issues.length + 1;

  const positionToInsert = calculateInsertPosition(currentSprintIssues);

  const issue = await prisma.issue.create({
    data: {
      key: `ISSUE-${k}`,
      name: valid.name,
      type: valid.type,
      status: valid.status ?? "TODO",
      assigneeId: valid.assigneeId ?? undefined,
      reporterId: valid.reporterId ?? "user_2PwZmH2xP5aE0svR6hDH4AwDlcu", // Rogan as default reporter
      sprintId: valid.sprintId ?? undefined,
      details: valid.details,
      sprintPosition: positionToInsert,
      boardPosition,
      parentId: valid.parentId,
      sprintColor: valid.sprintColor,
      creatorId: userId,
    },
  });
  // return NextResponse.json<PostIssueResponse>({ issue });
  return NextResponse.json({ issue });
}

export async function PATCH(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthenticated request", { status: 403 });
  const { success } = await ratelimit.limit(userId);
  if (!success) return new Response("Too many requests", { status: 429 });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body = await req.json();
  const validated = patchIssuesBodyValidator.safeParse(body);

  if (!validated.success) {
    // eslint-disable-next-line
    const message = "Invalid body. " + validated.error.errors[0]?.message;
    return new Response(message, { status: 400 });
  }

  const { data: valid } = validated;

  const issuesToUpdate = await prisma.issue.findMany({
    where: {
      id: {
        in: valid.ids,
      },
    },
  });

  const updatedIssues = await Promise.all(
    issuesToUpdate.map(async (issue) => {
      return await prisma.issue.update({
        where: {
          id: issue.id,
        },
        data: {
          type: valid.type ?? undefined,
          status: valid.status ?? undefined,
          assigneeId: valid.assigneeId ?? undefined,
          reporterId: valid.reporterId ?? undefined,
          isDeleted: valid.isDeleted ?? undefined,
          sprintId: valid.sprintId === undefined ? undefined : valid.sprintId,
          parentId: valid.parentId ?? undefined,
        },
      });
    })
  );

  // return NextResponse.json<PostIssueResponse>({ issue });
  return NextResponse.json({ issues: updatedIssues });
}
