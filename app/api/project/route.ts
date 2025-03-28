import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { type Project } from "@prisma/client";

export type GetProjectResponse = {
  project: Project | null;
};

export async function GET() {
  try {
    const project = await prisma.project.findUnique({
      where: {
        key: "JIRA-CLONE",
      },
    });
    return NextResponse.json({ project: project || null });
  } catch (error) {
    return NextResponse.json(
      { project: null, error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
