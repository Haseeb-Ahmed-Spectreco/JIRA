import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
// import { clerkClient } from "@clerk/nextjs/server";
// import { filterUserForClient } from "@/utils/helpers";
import { type DefaultUser } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";
import { filterUserForClient } from "@/utils/helpers";

export type GetProjectMembersResponse = {
  members: DefaultUser[];
};

type MembersParams = {
  params: {
    project_id: string;
  };
};

export async function GET(req: NextRequest, { params }: MembersParams) {
  const { project_id } = params;
  console.log("Project ID: ", project_id);
  const members = await prisma.member.findMany({
    where: {
      projectId: project_id,
    },
  });

  // USE THIS IF RUNNING LOCALLY -----------------------
  const users = await prisma.defaultUser.findMany({
    where: {
      id: {
        in: members.map((member) => member.id),
      },
    },
  });
  // --------------------------------------------------

  // COMMENT THIS IF RUNNING LOCALLY ------------------
  const clerkUsers = (
    await clerkClient.users.getUserList({
      userId: members.map((member) => member.id),
      limit: 20,
    })
  ).map(filterUserForClient);
  // --------------------------------------------------

  users.push(...clerkUsers);

  // return NextResponse.json<GetProjectMembersResponse>({ members:users });
  return NextResponse.json({ members: users });
}

export async function POST(req: NextRequest, { params }: MembersParams) {
  const { project_id } = params;
  const body = (await req.json()) as { data: { userId: string } };
  const { userId } = body.data;
  console.log("Project ID: ", project_id);
  console.log("User ID: ", userId);

  // Create project if it doesn't exist
  await prisma.project.upsert({
    where: { id: project_id },
    update: {},
    create: {
      id: project_id,
      key: `PROJ-${project_id.slice(0, 8).toUpperCase()}`,
      name: `Project ${project_id.slice(0, 8)}`,
    },
  });

  // Check if member already exists (since id is the primary key)
  const existingMember = await prisma.member.findUnique({
    where: {
      id: userId,
    },
  });

  if (existingMember) {
    return NextResponse.json(
      { error: "Member already exists" },
      { status: 409 }
    );
  }

  const member = await prisma.member.create({
    data: {
      id: userId,
      projectId: project_id,
    },
  });

  return NextResponse.json({ member });
}
