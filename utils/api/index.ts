import { projectRoutes } from "./project";
import { issuesRoutes } from "./issues";
import { sprintsRoutes } from "./sprints";
import { UserRoutes } from "./user";

export const api = {
  project: projectRoutes,
  issues: issuesRoutes,
  sprints: sprintsRoutes,
  user: UserRoutes,
};
