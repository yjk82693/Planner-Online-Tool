import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function req(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getMandal: () => req("/mandal"),
  saveMandal: (data: { mainGoal: string; subGoals: unknown[] }) =>
    req("/mandal", { method: "PUT", body: JSON.stringify(data) }),

  getTodos: () => req("/todos"),
  addTodo: (text: string, priority: number) =>
    req("/todos", { method: "POST", body: JSON.stringify({ text, priority }) }),
  updateTodo: (id: string, data: object) =>
    req(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTodo: (id: string) =>
    req(`/todos/${id}`, { method: "DELETE" }),

  getShop: () => req("/shop"),
  addShopItem: (name: string, cost: number) =>
    req("/shop", { method: "POST", body: JSON.stringify({ name, cost }) }),
  updateShopItem: (id: string, name: string, cost: number) =>
    req(`/shop/${id}`, { method: "PATCH", body: JSON.stringify({ name, cost }) }),
  deleteShopItem: (id: string) =>
    req(`/shop/${id}`, { method: "DELETE" }),

  getCourses: () => req("/courses"),
  addCourse: (name: string, category: string) =>
    req("/courses", { method: "POST", body: JSON.stringify({ name, category }) }),
  updateCourse: (id: string, data: object) =>
    req(`/courses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCourse: (id: string) =>
    req(`/courses/${id}`, { method: "DELETE" }),

  getDates: () => req("/dates"),
  addDate: (title: string, date: string, description: string, warningDays: number) =>
    req("/dates", { method: "POST", body: JSON.stringify({ title, date, description, warningDays }) }),
  deleteDate: (id: string) =>
    req(`/dates/${id}`, { method: "DELETE" }),

  getLogs: () => req("/logs"),
  addPointLog: (date: string, points: number, type: string, reason: string) =>
    req("/logs", { method: "POST", body: JSON.stringify({ date, points, type, reason }) }),
  saveDailyLog: (date: string, tasks: unknown[], pointsEarned: number) =>
    req("/logs/daily", { method: "POST", body: JSON.stringify({ date, tasks, pointsEarned }) }),
};