"use client";

import { useState } from "react";
import { Button, Input, Checkbox, Tag, Typography, Empty, Select } from "antd";
import { TodoItem, ImportantDate } from "@/types/mandal";

const { Text } = Typography;

interface Props {
  todos: TodoItem[];
  importantDates: ImportantDate[];
  onAdd: (text: string, priority: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetPriority: (id: string, priority: number) => void;
}

export default function TodoList({ todos, importantDates, onAdd, onToggle, onRemove, onSetPriority }: Props) {
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<number>(0);

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim(), newPriority);
    setNewText("");
    setNewPriority(0);
  };

  const top3 = todos
    .filter((t) => t.priority > 0)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  const rest = todos.filter((t) => t.priority === 0);

  const today = new Date().toISOString().slice(0, 10);
  const urgentDateIds = new Set(
    importantDates
      .filter((d) => {
        const daysAway = Math.ceil(
          (new Date(d.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
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
        <Checkbox
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
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
                <Tag color="blue" style={{ marginBottom: "4px" }}>P{t.priority}</Tag>
                <div>{t.text}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}