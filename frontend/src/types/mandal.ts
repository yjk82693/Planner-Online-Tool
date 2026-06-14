import { DailyLog } from "./dailyLog";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface SubGoal {
  id: number;
  title: string;
  color: string;
  tasks: Task[];
}

export interface MandalData {
  mainGoal: string;
  subGoals: SubGoal[];
}

export interface PointLog {
  date: string;
  points: number;
  type: "earned" | "spent";
  reason: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
}

// ─── To-do ───────────────────────────────────────────
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: number;      // 1-3 = top priority, 0 = normal
  importantDateId?: string;
}

// ─── Course Tracker ──────────────────────────────────
export type CourseCategory = "academic" | "self-study";
export type CourseStatus = "in-progress" | "completed";

export interface CourseAssignment {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface Course {
  id: string;
  name: string;
  category: CourseCategory;
  status: CourseStatus;
  assignments: CourseAssignment[];
  contents: string[];    // list of topics/modules
  reviews: string[];     // review notes
}

// ─── Important Dates ─────────────────────────────────
export interface ImportantDate {
  id: string;
  title: string;
  date: string;          // ISO date string
  description?: string;
  warningDays: number;   // show popup when this many days away
}

// add to PlannerState interface:
export interface PlannerState {
  mandal: MandalData;
  totalPoints: number;
  pointLogs: PointLog[];
  shopItems: ShopItem[];
  todos: TodoItem[];
  courses: Course[];
  importantDates: ImportantDate[];
  dailyLogs: DailyLog[];        // ← add this
}