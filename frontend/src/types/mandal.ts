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

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: number;
  importantDateId?: string;
  createdAt: string;
}

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
  contents: string[];
  reviews: string[];
}

export type Subject = "math" | "science" | "english" | "korean" | "history" | "other";
export type Curriculum = "KR" | "SAT" | "AP" | "IB";

export interface Lecture {
  id: string;
  title: string;
  subject: Subject;
  curriculum: Curriculum;
  videoUrl: string;
  duration: number;
  thumbnailUrl?: string;
}

export interface LectureProgress {
  lectureId: string;
  watchedSeconds: number;
  completed: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  members: string[];
  isGroup: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  sentAt: string;
}

export interface Note {
  id: string;
  userId: string;
  lectureId?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportantDate {
  id: string;
  title: string;
  date: string;
  description?: string;
  warningDays: number;
}

export interface PlannerState {
  mandal: MandalData;
  totalPoints: number;
  pointLogs: PointLog[];
  shopItems: ShopItem[];
  todos: TodoItem[];
  courses: Course[];
  importantDates: ImportantDate[];
  dailyLogs: import("./dailyLog").DailyLog[];
}