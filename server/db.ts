import { PrismaClient } from "@prisma/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(15, "1 m"), // 15 requests per minute
  analytics: true,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Handle graceful shutdown
if (typeof process !== "undefined") {
  process.on("beforeExit",  () => {
    void prisma.$disconnect();
  });
}

/**
 * Check if a user is an admin by their user ID
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isUserAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  
  const user = await prisma.defaultUser.findUnique({
    where: { id: userId },
  });
  
  return (user as { is_admin?: boolean } | null)?.is_admin === true;
}