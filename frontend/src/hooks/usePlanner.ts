"use client";

import { useState, useEffect, useCallback } from "react";
import { PlannerState, CourseCategory } from "@/types/mandal";
import { DailyLog } from "@/types/dailyLog";
import { loadState, saveState, DEFAULT_STATE } from "@/lib/storage";

export function usePlanner() {
  const [state, setState] = useState<PlannerState>(DEFAULT_STATE);

  useEffect(() => {
    const loaded = loadState();
    setState({
      ...loaded,
      todos: loaded.todos ?? [],
      courses: loaded.courses ?? [],
      importantDates: loaded.importantDates ?? [],
      dailyLogs: loaded.dailyLogs ?? [],
    });
  }, []);

  const update = useCallback((next: PlannerState) => {
    setState(next);
    saveState(next);
  }, []);

  // ─── Mandal ───────────────────────────────────────────
  const setMainGoal = (mainGoal: string) => {
    update({ ...state, mandal: { ...state.mandal, mainGoal } });
  };

  const setSubGoalTitle = (subGoalId: number, title: string) => {
    const subGoals = state.mandal.subGoals.map((sg) =>
      sg.id === subGoalId ? { ...sg, title } : sg
    );
    update({ ...state, mandal: { ...state.mandal, subGoals } });
  };

  const setTaskText = (subGoalId: number, taskIndex: number, text: string) => {
    const subGoals = state.mandal.subGoals.map((sg) =>
      sg.id === subGoalId
        ? { ...sg, tasks: sg.tasks.map((t, i) => i === taskIndex ? { ...t, text } : t) }
        : sg
    );
    update({ ...state, mandal: { ...state.mandal, subGoals } });
  };

  const toggleTask = (subGoalId: number, taskIndex: number) => {
    const subGoals = state.mandal.subGoals.map((sg) => {
      if (sg.id !== subGoalId) return sg;
      const tasks = sg.tasks.map((t, i) =>
        i === taskIndex ? { ...t, completed: !t.completed } : t
      );
      return { ...sg, tasks };
    });

    const task = state.mandal.subGoals
      .find((sg) => sg.id === subGoalId)
      ?.tasks[taskIndex];
    const wasCompleted = task?.completed ?? false;

    let pointLogs = [...state.pointLogs];
    if (wasCompleted) {
      const idx = pointLogs
        .map((l, i) => ({ ...l, i }))
        .reverse()
        .find((l) => l.type === "earned" && l.reason === (task?.text || "Task"))?.i;
      if (idx !== undefined) pointLogs.splice(idx, 1);
    } else {
      pointLogs.push({
        date: new Date().toISOString(),
        points: 1,
        type: "earned",
        reason: task?.text || "Task",
      });
    }

    update({
      ...state,
      mandal: { ...state.mandal, subGoals },
      totalPoints: Math.max(0, state.totalPoints + (wasCompleted ? -1 : 1)),
      pointLogs,
    });
  };

  // ─── Shop ─────────────────────────────────────────────
  const buyItem = (itemId: string) => {
    const item = state.shopItems.find((s) => s.id === itemId);
    if (!item || state.totalPoints < item.cost) return;
    update({
      ...state,
      totalPoints: state.totalPoints - item.cost,
      pointLogs: [
        ...state.pointLogs,
        {
          date: new Date().toISOString(),
          points: item.cost,
          type: "spent" as const,
          reason: `Shop: ${item.name}`,
        },
      ],
    });
  };

  const addShopItem = (name: string, cost: number) => {
    update({ ...state, shopItems: [...state.shopItems, { id: Date.now().toString(), name, cost }] });
  };

  const removeShopItem = (itemId: string) => {
    update({ ...state, shopItems: state.shopItems.filter((s) => s.id !== itemId) });
  };

  const editShopItem = (itemId: string, name: string, cost: number) => {
    update({
      ...state,
      shopItems: state.shopItems.map((s) => s.id === itemId ? { ...s, name, cost } : s),
    });
  };

  // ─── Point log ────────────────────────────────────────
  const logDay = () => {
    update({
      ...state,
      pointLogs: [
        ...state.pointLogs,
        { date: new Date().toISOString(), points: 0, type: "earned" as const, reason: "Day logged" },
      ],
    });
  };

  const finishDay = () => {
    const subGoals = state.mandal.subGoals.map((sg) => ({
      ...sg,
      tasks: sg.tasks.map((t) => ({ ...t, completed: false })),
    }));
    const todos = state.todos.map((t) => ({ ...t, completed: false }));
    update({ ...state, mandal: { ...state.mandal, subGoals }, todos });
  };

  // ─── Backdate ─────────────────────────────────────────
  const saveBackdateLog = (log: DailyLog, spentItems: { reason: string; points: number }[]) => {
    // remove existing log for this date if any
    const existingLog = state.dailyLogs.find((l) => l.date === log.date);
    const oldEarned = existingLog?.pointsEarned ?? 0;
    const oldSpent = existingLog
      ? state.pointLogs
          .filter((l) => l.date.slice(0, 10) === log.date && l.type === "spent" && l.reason.startsWith("[Backdate]"))
          .reduce((s, l) => s + l.points, 0)
      : 0;

    // rebuild point logs — remove old backdate entries for this date
    const filteredLogs = state.pointLogs.filter((l) => {
      const isThisDate = l.date.slice(0, 10) === log.date;
      const isBackdate = l.reason.startsWith("[Backdate]");
      return !(isThisDate && isBackdate);
    });

    // add new earned logs
    const newEarnedLogs = log.tasks
      .filter((t) => t.completed)
      .map((t) => ({
        date: log.date + "T12:00:00.000Z",
        points: 1,
        type: "earned" as const,
        reason: `[Backdate] ${t.taskText}`,
      }));

    // add new spent logs
    const newSpentLogs = spentItems.map((s) => ({
      date: log.date + "T12:00:00.000Z",
      points: s.points,
      type: "spent" as const,
      reason: `[Backdate] ${s.reason}`,
    }));

    const totalNewEarned = newEarnedLogs.length;
    const totalNewSpent = spentItems.reduce((s, i) => s + i.points, 0);
    const pointDelta = (totalNewEarned - oldEarned) - (totalNewSpent - oldSpent);

    const dailyLogs = [
      ...state.dailyLogs.filter((l) => l.date !== log.date),
      { ...log, pointsEarned: totalNewEarned },
    ];

    update({
      ...state,
      totalPoints: Math.max(0, state.totalPoints + pointDelta),
      pointLogs: [...filteredLogs, ...newEarnedLogs, ...newSpentLogs],
      dailyLogs,
    });
  };

  // ─── To-do ────────────────────────────────────────────
  const addTodo = (text: string, priority: number) => {
    update({
      ...state,
      todos: [...state.todos, { id: Date.now().toString(), text, completed: false, priority }],
    });
  };

  const toggleTodo = (id: string) => {
    update({
      ...state,
      todos: state.todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
    });
  };

  const removeTodo = (id: string) => {
    update({ ...state, todos: state.todos.filter((t) => t.id !== id) });
  };

  const setTodoPriority = (id: string, priority: number) => {
    update({
      ...state,
      todos: state.todos.map((t) => t.id === id ? { ...t, priority } : t),
    });
  };

  // ─── Courses ──────────────────────────────────────────
  const addCourse = (name: string, category: CourseCategory) => {
    update({
      ...state,
      courses: [
        ...state.courses,
        {
          id: Date.now().toString(),
          name,
          category,
          status: "in-progress",
          assignments: [],
          contents: [],
          reviews: [],
        },
      ],
    });
  };

  const completeCourse = (id: string) => {
    update({
      ...state,
      courses: state.courses.map((c) =>
        c.id === id ? { ...c, status: "completed" as const } : c
      ),
    });
  };

  const removeCourse = (id: string) => {
    update({ ...state, courses: state.courses.filter((c) => c.id !== id) });
  };

  const addAssignment = (courseId: string, text: string) => {
    update({
      ...state,
      courses: state.courses.map((c) =>
        c.id === courseId
          ? { ...c, assignments: [...c.assignments, { id: Date.now().toString(), text, completed: false }] }
          : c
      ),
    });
  };

  const toggleAssignment = (courseId: string, assignmentId: string) => {
    update({
      ...state,
      courses: state.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              assignments: c.assignments.map((a) =>
                a.id === assignmentId ? { ...a, completed: !a.completed } : a
              ),
            }
          : c
      ),
    });
  };

  const addContent = (courseId: string, text: string) => {
    update({
      ...state,
      courses: state.courses.map((c) =>
        c.id === courseId ? { ...c, contents: [...c.contents, text] } : c
      ),
    });
  };

  const addReview = (courseId: string, text: string) => {
    update({
      ...state,
      courses: state.courses.map((c) =>
        c.id === courseId ? { ...c, reviews: [...c.reviews, text] } : c
      ),
    });
  };

  // ─── Important dates ──────────────────────────────────
  const addImportantDate = (title: string, date: string, description: string, warningDays: number) => {
    update({
      ...state,
      importantDates: [
        ...state.importantDates,
        { id: Date.now().toString(), title, date, description, warningDays },
      ],
    });
  };

  const removeImportantDate = (id: string) => {
    update({ ...state, importantDates: state.importantDates.filter((d) => d.id !== id) });
  };

  return {
    state,
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