import { NextResponse } from "next/server";
import { withClerkMiddleware } from "@clerk/nextjs/server";

export default withClerkMiddleware((req: Request) => {
  const res = NextResponse.next();
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, Clerk-Auth",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }
  if (origin) {
    res.headers.append("Access-Control-Allow-Origin", origin);
  }
  res.headers.append(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.append(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return res;
});
