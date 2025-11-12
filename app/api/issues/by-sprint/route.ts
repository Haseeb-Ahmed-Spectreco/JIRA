import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import {
  type Issue,
  type DefaultUser,
  type Comment,
  type Sprint,
} from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import {
  filterUserForClient,
  generateIssuesForClient,
} from "@/utils/helpers";
import type { CommentWithAuthor, GetIssuesResponse } from "../route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sprintId = searchParams.get("sprintId");

  if (!sprintId) {
    return NextResponse.json(
      { error: "sprintId is required" },
      { status: 400 }
    );
  }

  // Handle "backlog" as null sprintId
  const actualSprintId = sprintId === "backlog" ? null : sprintId;

  const whereIssue = {
    sprintId: actualSprintId,
    isDeleted: false,
  };

  const issues = await prisma.issue.findMany({
    where: whereIssue,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!issues || issues.length === 0) {
    return NextResponse.json({ issues: [] });
  }

  const activeSprints = await prisma.sprint.findMany({});

  const userIds = issues
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
      limit: 110,
    })
  ).map(filterUserForClient);

  users.push(...clerkUsers);

  const comments = await prisma.comment.findMany({
    where: {
      issueId: {
        in: issues.map((issue: Issue) => issue.id),
      },
    },
  });

  const commentAuthorIds = comments.map((comment: Comment) => comment.authorId);
  let commentUsers: DefaultUser[] = [];
  
  if (commentAuthorIds.length > 0) {
    commentUsers = await prisma.defaultUser.findMany({
      where: {
        id: {
          in: commentAuthorIds,
        },
      },
    });

    const clerkCommentUsers = (
      await clerkClient.users.getUserList({
        userId: commentAuthorIds,
        limit: 110,
      })
    ).map(filterUserForClient);

    commentUsers.push(...clerkCommentUsers);
  }

  const commentsWithAuthors: CommentWithAuthor[] = comments.map((comment: Comment) => {
    const author = commentUsers.find((u: DefaultUser) => u.id === comment.authorId) ?? null;
    return { ...comment, author };
  });

  const issuesForClient = generateIssuesForClient(
    issues,
    users,
    activeSprints.map((sprint: Sprint) => sprint.id),
    commentsWithAuthors
  );

  return NextResponse.json({ issues: issuesForClient } as GetIssuesResponse);
}

