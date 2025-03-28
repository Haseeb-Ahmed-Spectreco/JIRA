import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { type DefaultUser } from "@prisma/client";

export type GetUserResponse = {
  user: DefaultUser | null;
};

export type PostUserResponse = {
  user: DefaultUser;
};

type UserParams = {
  params: {
    user_id: string;
  };
};

export async function GET(req: NextRequest, { params }: UserParams) {
  const { user_id } = params;
  console.log("User ID: ", user_id);
  const user = await prisma.defaultUser.findUnique({
    where: {
      id: user_id,
    },
  });

  return NextResponse.json({ user: user });
}
