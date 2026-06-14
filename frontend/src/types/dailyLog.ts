export interface DailyTaskRecord {
  subGoalId: number;
  subGoalTitle: string;
  subGoalColor: string;
  taskIndex: number;
  taskText: string;
  completed: boolean;
}

export interface DailyLog {
  date: string;           // YYYY-MM-DD
  tasks: DailyTaskRecord[];
  pointsEarned: number;
  createdAt: string;      // ISO
}