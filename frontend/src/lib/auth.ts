const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("planner_token");
}

export function setToken(token: string) {
  localStorage.setItem("planner_token", token);
  document.cookie = `planner_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
}

export function clearToken() {
  localStorage.removeItem("planner_token");
  localStorage.removeItem("planner_state");
  document.cookie = "planner_token=; path=/; max-age=0";
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  setToken(data.token);
  return data;
}

export async function login(userId: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  setToken(data.token);
  return data;
}