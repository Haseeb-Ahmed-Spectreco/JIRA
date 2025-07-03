// Define your enums as TypeScript types for type safety
export const IssueType = {
  BUG: "BUG",
  TASK: "TASK",
  SUBTASK: "SUBTASK",
  STORY: "STORY",
  EPIC: "EPIC",
} as const

export const IssueStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const

export const SprintStatus = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  CLOSED: "CLOSED",
} as const

export const Duration = {
  ONE_WEEK: "ONE_WEEK",
  TWO_WEEKS: "TWO_WEEKS",
  THREE_WEEKS: "THREE_WEEKS",
  FOUR_WEEKS: "FOUR_WEEKS",
  CUSTOM: "CUSTOM",
} as const

// Create TypeScript types from the const objects
export type IssueType = (typeof IssueType)[keyof typeof IssueType]
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus]
export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus]
export type Duration = (typeof Duration)[keyof typeof Duration]
