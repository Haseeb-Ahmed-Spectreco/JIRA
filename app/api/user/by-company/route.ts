import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { type DefaultUser } from "@prisma/client";

export type GetUsersByCompanyResponse = {
  users: DefaultUser[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company_id = searchParams.get("company_id");
  const site_code = searchParams.get("site_code");

  if (!company_id || !site_code) {
    return NextResponse.json(
      { error: "company_id and site_code are required" },
      { status: 400 }
    );
  }

  const users = await prisma.defaultUser.findMany({
    where: {
      company_id: company_id,
      site_code: site_code,
    },
  });

  return NextResponse.json({ users: users });
}

