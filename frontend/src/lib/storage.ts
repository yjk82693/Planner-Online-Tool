import { PlannerState } from "@/types/mandal";

export const SUB_GOAL_COLORS = [
  "#FAC775",
  "#9FE1CB",
  "#F4C0D1",
  "#B5D4F4",
  "#C0DD97",
  "#CECBF6",
  "#F5C4B3",
  "#ED93B1",
];

export const DEFAULT_STATE: PlannerState = {
  mandal: {
    mainGoal: "",
    subGoals: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      title: "",
      color: SUB_GOAL_COLORS[i],
      tasks: Array.from({ length: 8 }, (_, j) => ({
        id: `${i}-${j}`,
        text: "",
        completed: false,
      })),
    })),
  },
  totalPoints: 0,
  pointLogs: [],
  shopItems: [],
  todos: [],
  courses: [],
  importantDates: [],
  dailyLogs: [],
};

export function loadState(): PlannerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem("planner_state");
    return raw ? (JSON.parse(raw) as PlannerState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: PlannerState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("planner_state", JSON.stringify(state));
}