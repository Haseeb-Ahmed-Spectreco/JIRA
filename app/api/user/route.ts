import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email: string;
    name: string;
    avatar?: string | null;
    company_id?: string | null;
    site_code?: string | null;
    type?: "DEV" | "CLIENT";
    is_admin?: boolean;
  };
  console.log("User Body: ", body);
  const user = await prisma.defaultUser.create({
    data: {
      email: body.email,
      name: body.name,
      avatar: body.avatar ?? null,
      company_id: body.company_id ?? null,
      site_code: body.site_code ?? null,
      type: body.type ?? "DEV",
      is_admin: body.is_admin ?? false,
    } as Prisma.DefaultUserCreateInput,
  });

  return NextResponse.json({ user: user });
}

export async function GET() {
  const user = await prisma.defaultUser.findMany();
  return NextResponse.json({ user: user });
}
