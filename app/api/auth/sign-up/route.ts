import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { hashPassword, createSession } from "@/utils/auth";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = signUpSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;

    // Check if user already exists
    const existingUser = await prisma.defaultUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (password is required for new signups)
    const user = await prisma.defaultUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        is_admin: false, // New signups are not admin by default
      },
    });

    // Create session
    await createSession(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

