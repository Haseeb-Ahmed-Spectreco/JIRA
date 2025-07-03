import { PrismaClient } from "@prisma/client"
import {
  generateInitialUserComments,
  generateInitialUserSprints,
  generateInitialUserIssues,
  defaultUsers,
  type DefaultUser,
} from "./seed-data"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // Check if we have users to seed
  if (defaultUsers.length === 0) {
    throw new Error("No default users found to seed!")
  }

  // Clear existing data (optional)
  console.log("🧹 Cleaning existing data...")
  await prisma.comment.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.sprint.deleteMany()
  await prisma.member.deleteMany()
  await prisma.project.deleteMany()
  await prisma.defaultUser.deleteMany()

  // Seed default users
  console.log("👥 Seeding default users...")
  await Promise.all(
    defaultUsers.map(
      async (user: DefaultUser) =>
        await prisma.defaultUser.upsert({
          where: { id: user.id },
          update: {},
          create: user,
        }),
    ),
  )

  // Create a test project
  console.log("📁 Creating test project...")
  const project = await prisma.project.create({
    data: {
      key: "TEST",
      name: "Test Project",
      defaultAssignee: defaultUsers[0]?.id,
    },
  })

  // Add members to project
  console.log("👤 Adding project members...")
  await Promise.all(
    defaultUsers.map(
      async (user: DefaultUser) =>
        await prisma.member.create({
          data: {
            id: user.id,
            projectId: project.id,
          },
        }),
    ),
  )

  // Seed data for the first user
  const userId = defaultUsers[0]?.id
  if (!userId) {
    throw new Error("No user ID found for seeding!")
  }

  console.log("🏃‍♂️ Seeding sprints...")
  const sprints = generateInitialUserSprints(userId)
  const createdSprints = []
  for (const sprint of sprints) {
    const createdSprint = await prisma.sprint.create({ data: sprint })
    createdSprints.push(createdSprint)
  }

  console.log("📋 Seeding issues...")
  const issues = generateInitialUserIssues(userId)
  const createdIssues = []

  // Update sprint IDs to match actual created sprints
  for (const issue of issues) {
    const updatedIssue = { ...issue }

    // Map the hardcoded sprint IDs to actual created sprint IDs
    if (issue.sprintId) {
      const matchingSprint = createdSprints.find(
        (s) =>
          (s.name === "Bazinga Blitz" && issue.sprintId?.includes("edd0e2b1-b230-4f02")) ||
          (s.name === "Cognitive Conundrum" && issue.sprintId?.includes("880ececc-f628-4de3")),
      )
      if (matchingSprint) {
        updatedIssue.sprintId = matchingSprint.id
      }
    }

    const createdIssue = await prisma.issue.create({ data: updatedIssue })
    createdIssues.push(createdIssue)
  }

  console.log("💬 Seeding comments...")
  const comments = generateInitialUserComments(userId)

  // Create comments with proper issue references
  for (const comment of comments) {
    // Find the matching issue by looking for issues that contain similar ID patterns
    const matchingIssue = createdIssues.find((issue) => {
      // Match based on the issue key or name since IDs are generated
      return (
        (comment.issueId.includes("cd44dff4-d69b-4724") && issue.key === "ISSUE-2") ||
        (comment.issueId.includes("55a7d19e-844c-40fd") && issue.key === "ISSUE-3")
      )
    })

    if (matchingIssue) {
      await prisma.comment.create({
        data: {
          ...comment,
          issueId: matchingIssue.id, // Use the actual created issue ID
        },
      })
    } else {
      console.warn(`⚠️ Could not find matching issue for comment ${comment.id}`)
    }
  }

  console.log("✅ Database seeding completed successfully!")
}

main()
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e)
     await prisma.$disconnect()
    process.exit(1)
  })

