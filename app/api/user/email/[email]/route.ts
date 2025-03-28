import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

type UserEmailParams = {
  params: {
    email: string;
  };
};

export async function GET(req: NextRequest, { params }: UserEmailParams) {
  const { email } = params;
  console.log("User Email: ", email);
  const user = await prisma.defaultUser.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, {
      status: 404,
    } as ResponseInit);
  }

  return NextResponse.json({ user: user });
}
