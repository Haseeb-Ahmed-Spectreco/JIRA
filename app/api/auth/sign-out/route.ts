import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    await clearSession();
    return NextResponse.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

