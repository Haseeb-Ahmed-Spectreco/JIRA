import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/utils/auth";
import { isUserAdmin } from "@/server/db";
import { hashPassword } from "@/utils/auth";

export async function POST(req: NextRequest) {
  // Check if user is authenticated and is admin
  const userId = getSessionUserId(req);
  
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: Authentication required" },
      { status: 401 }
    );
  }

  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required to create users" },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    email: string;
    name: string;
    password: string;
    avatar?: string | null;
    company_id?: string | null;
    site_code?: string | null;
    type?: "DEV" | "CLIENT";
    is_admin?: boolean;
  };

  // Validate required fields
  if (!body.email || !body.name || !body.password) {
    return NextResponse.json(
      { error: "Email, name, and password are required" },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = await prisma.defaultUser.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 }
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(body.password);

  console.log("Creating user (admin action): ", body.email);
  const user = await prisma.defaultUser.create({
    data: {
      email: body.email,
      name: body.name,
      password: hashedPassword,
      avatar: body.avatar ?? null,
      company_id: body.company_id ?? null,
      site_code: body.site_code ?? null,
      type: body.type ?? "DEV",
      is_admin: body.is_admin ?? false,
    } as Prisma.DefaultUserCreateInput,
  });

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword });
}

export async function GET() {
  const user = await prisma.defaultUser.findMany();
  return NextResponse.json({ user: user });
}
