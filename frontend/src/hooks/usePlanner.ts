"use client";

import { useState, useEffect, useCallback } from "react";
import { PlannerState, CourseCategory } from "@/types/mandal";
import { DailyLog } from "@/types/dailyLog";
import { DEFAULT_STATE } from "@/lib/storage";
import { api } from "@/lib/api";

export function usePlanner() {
  const [state, setState] = useState<PlannerState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [mandal, todos, courses, dates, logs] = await Promise.all([
          api.getMandal(),
          api.getTodos(),
          api.getCourses(),
          api.getDates(),
          api.getLogs(),
        ]);

        let shop = await api.getShop();
        if (shop.length === 0) {
          const defaults = [
            { name: "Coffee", cost: 10 },
            { name: "Movie night", cost: 30 },
            { name: "New book", cost: 50 },
          ];
          shop = await Promise.all(
            defaults.map((item) => api.addShopItem(item.name, item.cost))
          );
        }

        setState({
          mandal: mandal.mainGoal ? mandal : DEFAULT_STATE.mandal,
          totalPoints:
            logs.pointLogs
              .filter((l: { type: string; points: number }) => l.type === "earned")
              .reduce((s: number, l: { points: number }) => s + l.points, 0) -
            logs.pointLogs
              .filter((l: { type: string; points: number }) => l.type === "spent")
              .reduce((s: number, l: { points: number }) => s + l.points, 0),
          pointLogs: logs.pointLogs,
          shopItems: shop,
          todos,
          courses,
          importantDates: dates,
          dailyLogs: logs.dailyLogs,
        });
      } catch (err) {
        console.error("Failed to fetch from backend:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ─── Mandal ───────────────────────────────────────────
  const setMainGoal = useCallback(async (mainGoal: string) => {
    const subGoals = state.mandal.subGoals;
    setState((prev) => ({ ...prev, mandal: { ...prev.mandal, mainGoal } }));
    await api.saveMandal({ mainGoal, subGoals });
  }, [state.mandal]);

  const setSubGoalTitle = useCallback(async (subGoalId: number, title: string) => {
    const subGoals = state.mandal.subGoals.map((sg) =>
      sg.id === subGoalId ? { ...sg, title } : sg
    );
    setState((prev) => ({ ...prev, mandal: { ...prev.mandal, subGoals } }));
    await api.saveMandal({ mainGoal: state.mandal.mainGoal, subGoals });
  }, [state.mandal]);

  const setTaskText = useCallback(async (subGoalId: number, taskIndex: number, text: string) => {
    const subGoals = state.mandal.subGoals.map((sg) =>
      sg.id === subGoalId
        ? { ...sg, tasks: sg.tasks.map((t, i) => i === taskIndex ? { ...t, text } : t) }
        : sg
    );
    setState((prev) => ({ ...prev, mandal: { ...prev.mandal, subGoals } }));
    await api.saveMandal({ mainGoal: state.mandal.mainGoal, subGoals });
  }, [state.mandal]);

  const toggleTask = useCallback(async (subGoalId: number, taskIndex: number) => {
    const subGoals = state.mandal.subGoals.map((sg) => {
      if (sg.id !== subGoalId) return sg;
      return {
        ...sg,
        tasks: sg.tasks.map((t, i) =>
          i === taskIndex ? { ...t, completed: !t.completed } : t
        ),
      };
    });

    const task = state.mandal.subGoals.find((sg) => sg.id === subGoalId)?.tasks[taskIndex];
    const wasCompleted = task?.completed ?? false;

    let pointLogs = [...state.pointLogs];
    if (wasCompleted) {
      const idx = pointLogs
        .map((l, i) => ({ ...l, i }))
        .reverse()
        .find((l) => l.type === "earned" && l.reason === (task?.text || "Task"))?.i;
      if (idx !== undefined) pointLogs.splice(idx, 1);
    } else {
      const newLog = {
        date: new Date().toISOString(),
        points: 1,
        type: "earned" as const,
        reason: task?.text || "Task",
      };
      pointLogs.push(newLog);
      await api.addPointLog(newLog.date, newLog.points, newLog.type, newLog.reason);
    }

    const newTotal = Math.max(0, state.totalPoints + (wasCompleted ? -1 : 1));
    setState((prev) => ({
      ...prev,
      mandal: { ...prev.mandal, subGoals },
      totalPoints: newTotal,
      pointLogs,
    }));
    await api.saveMandal({ mainGoal: state.mandal.mainGoal, subGoals });
  }, [state]);

  // ─── Shop ─────────────────────────────────────────────
  const buyItem = useCallback(async (itemId: string) => {
    const item = state.shopItems.find((s) => s.id === itemId);
    if (!item || state.totalPoints < item.cost) return;
    const log = {
      date: new Date().toISOString(),
      points: item.cost,
      type: "spent" as const,
      reason: `Shop: ${item.name}`,
    };
    setState((prev) => ({
      ...prev,
      totalPoints: prev.totalPoints - item.cost,
      pointLogs: [...prev.pointLogs, log],
    }));
    await api.addPointLog(log.date, log.points, log.type, log.reason);
  }, [state]);

  const addShopItem = useCallback(async (name: string, cost: number) => {
    const newItem = await api.addShopItem(name, cost);
    setState((prev) => ({ ...prev, shopItems: [...prev.shopItems, newItem] }));
  }, []);

  const removeShopItem = useCallback(async (itemId: string) => {
    await api.deleteShopItem(itemId);
    setState((prev) => ({ ...prev, shopItems: prev.shopItems.filter((s) => s.id !== itemId) }));
  }, []);

  const editShopItem = useCallback(async (itemId: string, name: string, cost: number) => {
    await api.updateShopItem(itemId, name, cost);
    setState((prev) => ({
      ...prev,
      shopItems: prev.shopItems.map((s) => s.id === itemId ? { ...s, name, cost } : s),
    }));
  }, []);

  // ─── Point log ────────────────────────────────────────
  const logDay = useCallback(async () => {
    const log = {
      date: new Date().toISOString(),
      points: 0,
      type: "earned" as const,
      reason: "Day logged",
    };
    await api.addPointLog(log.date, log.points, log.type, log.reason);
    setState((prev) => ({ ...prev, pointLogs: [...prev.pointLogs, log] }));
  }, []);

  const finishDay = useCallback(async () => {
    const subGoals = state.mandal.subGoals.map((sg) => ({
      ...sg,
      tasks: sg.tasks.map((t) => ({ ...t, completed: false })),
    }));
    const todos = state.todos.map((t) => ({ ...t, completed: false }));
    setState((prev) => ({ ...prev, mandal: { ...prev.mandal, subGoals }, todos }));
    await api.saveMandal({ mainGoal: state.mandal.mainGoal, subGoals });
    for (const todo of todos) {
      await api.updateTodo(todo.id, { completed: false });
    }
  }, [state]);

  // ─── Backdate ─────────────────────────────────────────
  const saveBackdateLog = useCallback(async (
    log: DailyLog,
    spentItems: { reason: string; points: number }[]
  ) => {
    const existingLog = state.dailyLogs.find((l) => l.date === log.date);
    const oldEarned = existingLog?.pointsEarned ?? 0;
    const oldSpent = state.pointLogs
      .filter((l) => l.date.slice(0, 10) === log.date && l.reason.startsWith("[Backdate]") && l.type === "spent")
      .reduce((s, l) => s + l.points, 0);

    const filteredLogs = state.pointLogs.filter((l) => {
      const isThisDate = l.date.slice(0, 10) === log.date;
      const isBackdate = l.reason.startsWith("[Backdate]");
      return !(isThisDate && isBackdate);
    });

    const newEarnedLogs = log.tasks.filter((t) => t.completed).map((t) => ({
      date: log.date + "T12:00:00.000Z",
      points: 1,
      type: "earned" as const,
      reason: `[Backdate] ${t.taskText}`,
    }));

    const newSpentLogs = spentItems.map((s) => ({
      date: log.date + "T12:00:00.000Z",
      points: s.points,
      type: "spent" as const,
      reason: `[Backdate] ${s.reason}`,
    }));

    for (const l of newEarnedLogs) {
      await api.addPointLog(l.date, l.points, l.type, l.reason);
    }
    for (const l of newSpentLogs) {
      await api.addPointLog(l.date, l.points, l.type, l.reason);
    }

    await api.saveDailyLog(log.date, log.tasks, newEarnedLogs.length);

    const totalNewEarned = newEarnedLogs.length;
    const totalNewSpent = spentItems.reduce((s, i) => s + i.points, 0);
    const pointDelta = (totalNewEarned - oldEarned) - (totalNewSpent - oldSpent);

    setState((prev) => ({
      ...prev,
      totalPoints: Math.max(0, prev.totalPoints + pointDelta),
      pointLogs: [...filteredLogs, ...newEarnedLogs, ...newSpentLogs],
      dailyLogs: [
        ...prev.dailyLogs.filter((l) => l.date !== log.date),
        { ...log, pointsEarned: totalNewEarned },
      ],
    }));
  }, [state]);

  // ─── To-do ────────────────────────────────────────────
  const addTodo = useCallback(async (text: string, priority: number) => {
    const newTodo = await api.addTodo(text, priority);
    setState((prev) => ({ ...prev, todos: [...prev.todos, newTodo] }));
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return;
    const updated = { ...todo, completed: !todo.completed };
    await api.updateTodo(id, { completed: updated.completed });
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => t.id === id ? updated : t),
    }));
  }, [state.todos]);

  const removeTodo = useCallback(async (id: string) => {
    await api.deleteTodo(id);
    setState((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== id) }));
  }, []);

  const setTodoPriority = useCallback(async (id: string, priority: number) => {
    await api.updateTodo(id, { priority });
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => t.id === id ? { ...t, priority } : t),
    }));
  }, []);

  // ─── Courses ──────────────────────────────────────────
  const addCourse = useCallback(async (name: string, category: CourseCategory) => {
    const newCourse = await api.addCourse(name, category);
    setState((prev) => ({ ...prev, courses: [...prev.courses, newCourse] }));
  }, []);

  const completeCourse = useCallback(async (id: string) => {
    await api.updateCourse(id, { status: "completed" });
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => c.id === id ? { ...c, status: "completed" as const } : c),
    }));
  }, []);

  const removeCourse = useCallback(async (id: string) => {
    await api.deleteCourse(id);
    setState((prev) => ({ ...prev, courses: prev.courses.filter((c) => c.id !== id) }));
  }, []);

  const addAssignment = useCallback(async (courseId: string, text: string) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) return;
    const newAssignment = { id: Date.now().toString(), text, completed: false };
    const assignments = [...course.assignments, newAssignment];
    await api.updateCourse(courseId, { assignments });
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => c.id === courseId ? { ...c, assignments } : c),
    }));
  }, [state.courses]);

  const toggleAssignment = useCallback(async (courseId: string, assignmentId: string) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) return;
    const assignments = course.assignments.map((a) =>
      a.id === assignmentId ? { ...a, completed: !a.completed } : a
    );
    await api.updateCourse(courseId, { assignments });
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => c.id === courseId ? { ...c, assignments } : c),
    }));
  }, [state.courses]);

  const addContent = useCallback(async (courseId: string, text: string) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) return;
    const contents = [...course.contents, text];
    await api.updateCourse(courseId, { contents });
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => c.id === courseId ? { ...c, contents } : c),
    }));
  }, [state.courses]);

  const addReview = useCallback(async (courseId: string, text: string) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) return;
    const reviews = [...course.reviews, text];
    await api.updateCourse(courseId, { reviews });
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => c.id === courseId ? { ...c, reviews } : c),
    }));
  }, [state.courses]);

  // ─── Important dates ──────────────────────────────────
  const addImportantDate = useCallback(async (
    title: string, date: string, description: string, warningDays: number
  ) => {
    const newDate = await api.addDate(title, date, description, warningDays);
    setState((prev) => ({ ...prev, importantDates: [...prev.importantDates, newDate] }));
  }, []);

  const removeImportantDate = useCallback(async (id: string) => {
    await api.deleteDate(id);
    setState((prev) => ({
      ...prev,
      importantDates: prev.importantDates.filter((d) => d.id !== id),
    }));
  }, []);

  return {
    state,
    loading,
    setMainGoal,
    setSubGoalTitle,
    setTaskText,
    toggleTask,
    buyItem,
    addShopItem,
    removeShopItem,
    editShopItem,
    logDay,
    finishDay,
    saveBackdateLog,
    addTodo,
    toggleTodo,
    removeTodo,
    setTodoPriority,
    addCourse,
    completeCourse,
    removeCourse,
    addAssignment,
    toggleAssignment,
    addContent,
    addReview,
    addImportantDate,
    removeImportantDate,
  };
}