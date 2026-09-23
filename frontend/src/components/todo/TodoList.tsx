"use client";

import { useState, useMemo, useEffect } from "react";
import { Button, Input, Checkbox, Tag, Typography, Empty, Select, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { TodoItem, ImportantDate, Course } from "@/types/mandal";

const { Text } = Typography;

function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  todos: TodoItem[];
  importantDates: ImportantDate[];
  courses: Course[];
  onAdd: (text: string, priority: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetPriority: (id: string, priority: number) => void;
}

const CARRY_OVER_SHOWN_KEY = "carryOverBannerShownDate";

export default function TodoList({ todos, importantDates, courses, onAdd, onToggle, onRemove, onSetPriority }: Props) {
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<number>(0);
  const [carryOverSelections, setCarryOverSelections] = useState<Record<string, { selected: boolean; priority: number }>>({});

  const todayKey = getLocalDateKey();

  const [carryOverDone, setCarryOverDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CARRY_OVER_SHOWN_KEY) === todayKey;
  });

  const incompleteTodos = useMemo(() => {
    return todos.filter(
      (t) => !t.completed && t.createdAt?.slice(0, 10) < todayKey
    );
  }, [todos, todayKey]);

  const showCarryOver = incompleteTodos.length > 0 && !carryOverDone;

  useEffect(() => {
    if (showCarryOver) {
      localStorage.setItem(CARRY_OVER_SHOWN_KEY, todayKey);
    }
  }, [showCarryOver, todayKey]);

  // Pending assignments from in-progress courses, as suggestions to pull
  // into today's list — excludes ones already added as a todo (matched by text).
  const assignmentSuggestions = useMemo(() => {
    const existingTexts = new Set(todos.map((t) => t.text));
    const suggestions: { key: string; courseId: string; courseName: string; text: string; dueDate?: string }[] = [];
    for (const course of courses) {
      if (course.status !== "in-progress") continue;
      for (const a of course.assignments) {
        if (a.completed) continue;
        const text = `${course.name}: ${a.text}`;
        if (existingTexts.has(text)) continue;
        suggestions.push({ key: a.id, courseId: course.id, courseName: course.name, text, dueDate: a.dueDate });
      }
    }
    return suggestions.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [courses, todos]);

  const handleCarryOverToggle = (id: string) => {
    setCarryOverSelections((prev) => ({
      ...prev,
      [id]: {
        selected: !prev[id]?.selected,
        priority: prev[id]?.priority ?? 0,
      },
    }));
  };

  const handleCarryOverPriority = (id: string, priority: number) => {
    setCarryOverSelections((prev) => ({
      ...prev,
      [id]: {
        selected: prev[id]?.selected ?? false,
        priority,
      },
    }));
  };

  const handleCarryOver = () => {
    Object.entries(carryOverSelections).forEach(([id, { selected, priority }]) => {
      if (selected) {
        onSetPriority(id, priority);
      } else {
        onRemove(id);
      }
    });
    incompleteTodos.forEach((todo) => {
      if (!carryOverSelections[todo.id]?.selected) {
        onRemove(todo.id);
      }
    });
    setCarryOverDone(true);
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim(), newPriority);
    setNewText("");
    setNewPriority(0);
  };

  const top3 = todos
    .filter((t) => t.priority > 0 && !t.completed)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  const rest = todos.filter((t) => t.priority === 0 && !t.completed);
  const completed = todos.filter((t) => t.completed);

  const urgentDateIds = new Set(
    importantDates
      .filter((d) => {
        const daysAway = Math.ceil(
          (new Date(d.date).getTime() - new Date(todayKey).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysAway >= 0 && daysAway <= d.warningDays;
      })
      .map((d) => d.id)
  );

  const renderTodo = (todo: TodoItem) => {
    const isUrgent = todo.importantDateId && urgentDateIds.has(todo.importantDateId);
    return (
      <div
        key={todo.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          border: "0.5px solid #f0f0f0",
          borderRadius: "8px",
          background: todo.completed ? "#fafafa" : "#fff",
        }}
      >
        <Checkbox checked={todo.completed} onChange={() => onToggle(todo.id)} />
        <Text
          style={{
            flex: 1,
            textDecoration: todo.completed ? "line-through" : "none",
            color: todo.completed ? "#aaa" : "#333",
            fontSize: "13px",
          }}
        >
          {isUrgent && <span style={{ color: "red", marginRight: "6px" }}>★</span>}
          {todo.text}
        </Text>
        <Select
          size="small"
          value={todo.priority}
          onChange={(val) => onSetPriority(todo.id, val)}
          style={{ width: "110px", fontSize: "12px" }}
          options={[
            { value: 0, label: "Normal" },
            { value: 1, label: "Priority 1" },
            { value: 2, label: "Priority 2" },
            { value: 3, label: "Priority 3" },
          ]}
        />
        <Button size="small" danger onClick={() => onRemove(todo.id)}>✕</Button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

        {showCarryOver && (
          <Card
            size="small"
            style={{ border: "1px dashed #7F77DD", borderRadius: "8px", background: "#faf9ff" }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#7F77DD" }}>↩</span>
                <Text strong style={{ color: "#7F77DD", fontSize: "13px" }}>
                  {incompleteTodos.length} incomplete task{incompleteTodos.length > 1 ? "s" : ""} from previous days — carry over?
                </Text>
              </div>
            }
            extra={
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  size="small"
                  type="primary"
                  style={{ background: "#7F77DD", borderColor: "#7F77DD" }}
                  onClick={handleCarryOver}
                >
                  Carry over selected
                </Button>
                <Button size="small" onClick={() => {
                  incompleteTodos.forEach((todo) => onRemove(todo.id));
                  setCarryOverDone(true);
                }}>
                  Dismiss
                </Button>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {incompleteTodos.map((todo) => {
                const sel = carryOverSelections[todo.id];
                return (
                  <div
                    key={todo.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: sel?.selected ? "#ede9ff" : "transparent",
                    }}
                  >
                    <Checkbox
                      checked={sel?.selected ?? false}
                      onChange={() => handleCarryOverToggle(todo.id)}
                    />
                    <Text style={{ flex: 1, fontSize: "12px" }}>{todo.text}</Text>
                    <Select
                      size="small"
                      value={sel?.priority ?? todo.priority}
                      onChange={(val) => handleCarryOverPriority(todo.id, val)}
                      style={{ width: "110px" }}
                      options={[
                        { value: 0, label: "Normal" },
                        { value: 1, label: "Priority 1" },
                        { value: 2, label: "Priority 2" },
                        { value: 3, label: "Priority 3" },
                      ]}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {assignmentSuggestions.length > 0 && (
          <Card
            size="small"
            style={{ border: "1px dashed #1677ff", borderRadius: "8px", background: "#f0f7ff" }}
            title={
              <Text strong style={{ color: "#1677ff", fontSize: "13px" }}>
                From your courses — add to today&apos;s list?
              </Text>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {assignmentSuggestions.map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <Text style={{ flex: 1, fontSize: "12px" }}>{s.text}</Text>
                  {s.dueDate && (
                    <Tag color="blue" style={{ fontSize: "11px" }}>
                      Due {new Date(s.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </Tag>
                  )}
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => onAdd(s.text, 0)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {top3.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Text strong style={{ fontSize: "13px", color: "#888" }}>Top priorities</Text>
            {top3.map(renderTodo)}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Text strong style={{ fontSize: "13px", color: "#888" }}>All tasks</Text>
          {todos.length === 0 ? (
            <Empty description="No tasks yet" />
          ) : (
            rest.map(renderTodo)
          )}
        </div>

        {completed.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Text strong style={{ fontSize: "13px", color: "#aaa" }}>Completed</Text>
            {completed.map(renderTodo)}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            paddingTop: "12px",
            borderTop: "0.5px solid #f0f0f0",
            marginTop: "auto",
          }}
        >
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a task..."
            onPressEnter={handleAdd}
            style={{ flex: 1 }}
          />
          <Select
            value={newPriority}
            onChange={(val) => setNewPriority(val)}
            style={{ width: "110px" }}
            options={[
              { value: 0, label: "Normal" },
              { value: 1, label: "Priority 1" },
              { value: 2, label: "Priority 2" },
              { value: 3, label: "Priority 3" },
            ]}
          />
          <Button type="primary" onClick={handleAdd}>Add</Button>
        </div>
      </div>

      <div
        style={{
          width: "240px",
          border: "0.5px solid #f0f0f0",
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Text strong style={{ fontSize: "13px", color: "#888" }}>On-progress projects</Text>
        {todos.filter((t) => !t.completed && t.priority > 0).length === 0 ? (
          <Empty description="No active priorities" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          todos
            .filter((t) => !t.completed && t.priority > 0)
            .sort((a, b) => a.priority - b.priority)
            .map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "8px",
                  background: "#f9f9f9",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                <Tag color="blue" style={{ margin: "0 0 4px" }}>P{t.priority}</Tag>
                <div>{t.text}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
