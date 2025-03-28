import { prisma } from "@/server/db";
import { type DefaultUser } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DefaultUser;
  console.log("User Body: ", body);
  const user = await prisma.defaultUser.create({
    data: {
      id: body.id,
      email: body.email,
      name: body.name,
      avatar: body.avatar,
    },
  });

  return NextResponse.json({ user: user });
}

export async function GET() {
  const user = await prisma.defaultUser.findMany();
  return NextResponse.json({ user: user });
}
