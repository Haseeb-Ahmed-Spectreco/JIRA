import type { Sprint, Issue, Comment } from "@prisma/client"

export function generateInitialUserComments(userId: string): Comment[] {
  const now = new Date()
  const slicedUserId = userId ? userId.slice(5, 12) : "init"

  return [
    {
      id: "3c076895-c356-43d8-" + slicedUserId,
      content:
        '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"I must express my astonishment at the sheer lack of scientific rigor in your proposed solution. It appears to be nothing more than a fanciful flight of fancy, devoid of any logical foundation. I implore you to reconsider and approach the problem with the intellect it deserves. Sincerely, Dr. Sheldon Cooper.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
      authorId: "user_2PvBRngdvenUlFvQNAWbXIvYVy5",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isEdited: false,
      issueId: "cd44dff4-d69b-4724-" + slicedUserId,
      logId: null,
    },
    {
      id: "87423726-9cdb-4e03-" + slicedUserId,
      content:
        '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Thank you for your concerns, but innovation knows no boundaries. We will persist in exploring new possibilities.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
      authorId: "user_2PwYvTgm6kvgJIbWwN0xsei8izu",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isEdited: false,
      issueId: "55a7d19e-844c-40fd-" + slicedUserId,
      logId: null,
    },
    {
      id: "eef0aeb3-9407-4836-" + slicedUserId,
      content:
        '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"It has come to my attention that your proposed solution violates the fundamental laws of physics, rendering it completely untenable. As an intellectual of superior intellect, it is my obligation to point out such grave errors in your approach. I suggest you reconsider your strategy and consult with me, Dr. Sheldon Cooper, before making any further attempts. Rest assured, I will be available to guide you toward the correct path of logical reasoning and scientific principles. Thank you.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
      authorId: "user_2PvBRngdvenUlFvQNAWbXIvYVy5",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isEdited: false,
      issueId: "55a7d19e-844c-40fd-" + slicedUserId,
      logId: null,
    },
  ]
}

export function generateInitialUserSprints(userId: string): Sprint[] {
  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const slicedUserId = userId ? userId.slice(5, 12) : "init"

  return [
    {
      id: "edd0e2b1-b230-4f02-" + slicedUserId,
      name: "Bazinga Blitz",
      description: "",
      duration: "1 week",
      startDate: now,
      endDate: oneWeekFromNow,
      creatorId: userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: "ACTIVE",
    },
    {
      id: "880ececc-f628-4de3-" + slicedUserId,
      name: "Cognitive Conundrum",
      description: "Lets figure out this conundrum together.",
      duration: "3 weeks",
      startDate: null,
      endDate: null,
      creatorId: userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: "PENDING",
    },
  ]
}

export function generateInitialUserIssues(userId: string): Issue[] {
  const now = new Date()
  const slicedUserId = userId ? userId.slice(5, 12) : "init"

  return [
    // ... your existing issues array (keeping it short for brevity)
    {
      id: "1c5818e1-b920-45b2-" + slicedUserId,
      key: "ISSUE-12",
      name: "Issue types can be changed, click here and try it out!",
      description: null,
      details: "This is a task that can be converted to a bug or story.",
      status: "TODO",
      type: "STORY",
      sprintPosition: 1,
      boardPosition: -1,
      reporterId: "user_2PwZmH2xP5aE0svR6hDH4AwDlcu",
      assigneeId: null,
      parentId: "b6e4ace2-6911-40c6-" + slicedUserId,
      sprintId: "880ececc-f628-4de3-" + slicedUserId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      sprintColor: null,
      creatorId: userId,
    },
    // ... add all your other issues here
  ]
}

// Define the user type
export interface DefaultUser {
  id: string
  name: string
  email: string
  avatar: string | null
}

// Make sure to EXPORT defaultUsers
export const defaultUsers: DefaultUser[] = [
  {
    id: "user_2PwZmH2xP5aE0svR6hDH4AwDlcu",
    name: "Joe Rogan",
    email: "joe.rogan@jira.com",
    avatar: "https://images.clerk.dev/uploaded/img_2PwZslOi493tjduHiBADgDxhHlg.png",
  },
  {
    id: "user_2PwYvTgm6kvgJIbWwN0xsei8izu",
    name: "Steve Jobs",
    email: "steve.jobs@jira.com",
    avatar: "https://images.clerk.dev/uploaded/img_2PwjGSsR9nGqEhAyt5nydgXhBI1.webp",
  },
  {
    id: "user_2PvBRngdvenUlFvQNAWbXIvYVy5",
    name: "Sheldon Cooper",
    email: "sheldon.cooper@jira.com",
    avatar: "https://images.clerk.dev/uploaded/img_2Pwinee7Eg6qoSgqailCZSJt3uS.webp",
  },
]
