import { PlannerState } from "@/types/mandal";

const KEY = "planner_state";

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
    mainGoal: "Be CEO of a company like Disney / Nintendo",
    subGoals: [
      {
        id: 0,
        title: "Appearance & Health",
        color: SUB_GOAL_COLORS[0],
        tasks: [
          { id: "0-0", text: "Wash face & apply cream/sunscreen before going out", completed: false },
          { id: "0-1", text: "Walk 10,000 steps", completed: false },
          { id: "0-2", text: "Upper body weight training", completed: false },
          { id: "0-3", text: "Double chin massage", completed: false },
          { id: "0-4", text: "Sleep with orthodontic retainer", completed: false },
          { id: "0-5", text: "Take daily vitamins", completed: false },
          { id: "0-6", text: "Practice good posture", completed: false },
          { id: "0-7", text: "Run 3x per week for stamina", completed: false },
        ],
      },
      {
        id: 1,
        title: "Software Development",
        color: SUB_GOAL_COLORS[1],
        tasks: [
          { id: "1-0", text: "Solve 1-2 LeetCode problems", completed: false },
          { id: "1-1", text: "Complete an AWS certification module", completed: false },
          { id: "1-2", text: "Daily GitHub commit", completed: false },
          { id: "1-3", text: "Work on individual project", completed: false },
          { id: "1-4", text: "Update portfolio", completed: false },
          { id: "1-5", text: "Course review", completed: false },
          { id: "1-6", text: "C++ review", completed: false },
          { id: "1-7", text: "Game programming practice", completed: false },
        ],
      },
      {
        id: 2,
        title: "Writing",
        color: SUB_GOAL_COLORS[2],
        tasks: [
          { id: "2-0", text: "Write GDD (Game Design Document)", completed: false },
          { id: "2-1", text: "Write game scenario", completed: false },
          { id: "2-2", text: "Write one scene for animated film script", completed: false },
          { id: "2-3", text: "Copy a masterpiece passage", completed: false },
          { id: "2-4", text: "Collect interesting sentences", completed: false },
          { id: "2-5", text: "Write a daily journal entry", completed: false },
          { id: "2-6", text: "Read and analyze a screenplay or novel chapter", completed: false },
          { id: "2-7", text: "Write a short story or scene from scratch", completed: false },
        ],
      },
      {
        id: 3,
        title: "Speaking",
        color: SUB_GOAL_COLORS[3],
        tasks: [
          { id: "3-0", text: "Organize thoughts before speaking out", completed: false },
          { id: "3-1", text: "Read out loud daily", completed: false },
          { id: "3-2", text: "Talk with an English-speaking friend", completed: false },
          { id: "3-3", text: "Read out interesting sentences you collected", completed: false },
          { id: "3-4", text: "Practice telling one joke or funny story", completed: false },
          { id: "3-5", text: "Watch and analyze a stand-up comedian or funny speech", completed: false },
          { id: "3-6", text: "Record yourself speaking for 1 minute", completed: false },
          { id: "3-7", text: "Start a conversation with a stranger", completed: false },
        ],
      },
      {
        id: 4,
        title: "Art",
        color: SUB_GOAL_COLORS[4],
        tasks: [
          { id: "4-0", text: "Sketch a character concept (rough)", completed: false },
          { id: "4-1", text: "Study and copy a character sheet from an artist you admire", completed: false },
          { id: "4-2", text: "Draw one storyboard panel per day", completed: false },
          { id: "4-3", text: "Practice basic anatomy (hands, faces, poses)", completed: false },
          { id: "4-4", text: "Collect visual references and build a mood board", completed: false },
          { id: "4-5", text: "Study composition and framing (film/game screenshots)", completed: false },
          { id: "4-6", text: "Watch a character design or animation breakdown video", completed: false },
          { id: "4-7", text: "Write + sketch a one-page story idea", completed: false },
        ],
      },
      {
        id: 5,
        title: "Endurance",
        color: SUB_GOAL_COLORS[5],
        tasks: [
          { id: "5-0", text: "Write a journal entry", completed: false },
          { id: "5-1", text: "Face one fear or uncomfortable change today", completed: false },
          { id: "5-2", text: "Look back on a regret and consciously close it", completed: false },
          { id: "5-3", text: "When reluctant — do it anyway", completed: false },
          { id: "5-4", text: "Get good sleep (7-8 hours)", completed: false },
          { id: "5-5", text: "Run (linked with Appearance & Health)", completed: false },
          { id: "5-6", text: "Meditate", completed: false },
          { id: "5-7", text: "Maintain eye contact in conversations", completed: false },
        ],
      },
      {
        id: 6,
        title: "Networking",
        color: SUB_GOAL_COLORS[6],
        tasks: [
          { id: "6-0", text: "Check LinkedIn", completed: false },
          { id: "6-1", text: "Search and apply for opportunities", completed: false },
          { id: "6-2", text: "Edit resume", completed: false },
          { id: "6-3", text: "Call family", completed: false },
          { id: "6-4", text: "Reach out to one new person in your field", completed: false },
          { id: "6-5", text: "Engage with a post or project you genuinely admire", completed: false },
          { id: "6-6", text: "Attend or watch a talk, meetup, or industry event", completed: false },
          { id: "6-7", text: "Write down one person you want to collaborate with and why", completed: false },
        ],
      },
      {
        id: 7,
        title: "Productivity",
        color: SUB_GOAL_COLORS[7],
        tasks: [
          { id: "7-0", text: "Limit game hours", completed: false },
          { id: "7-1", text: "Limit YouTube hours", completed: false },
          { id: "7-2", text: "Wake up at 7am", completed: false },
          { id: "7-3", text: "Check planner and start the day with it", completed: false },
          { id: "7-4", text: "Check email", completed: false },
          { id: "7-5", text: "Work on assignments", completed: false },
          { id: "7-6", text: "Finish today's to-do list", completed: false },
          { id: "7-7", text: "Plan tomorrow's tasks before going to bed", completed: false },
        ],
      },
    ],
  },
  totalPoints: 0,
  pointLogs: [],
  shopItems: [
    { id: "1", name: "Coffee", cost: 10 },
    { id: "2", name: "Movie night", cost: 30 },
    { id: "3", name: "New book", cost: 50 },
  ],
  todos: [],
  courses: [],
  importantDates: [],
  dailyLogs: [],
};

export function loadState(): PlannerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PlannerState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: PlannerState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}