"use client";

import { useState } from "react";
import { Button, Input, InputNumber, List, Tag, Typography, Empty, Modal } from "antd";
import { ImportantDate } from "@/types/mandal";

const { Text } = Typography;

interface Props {
  dates: ImportantDate[];
  onAdd: (title: string, date: string, description: string, warningDays: number) => void;
  onRemove: (id: string) => void;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ImportantDates({ dates, onAdd, onRemove }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [warningDays, setWarningDays] = useState<number>(7);

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    onAdd(title.trim(), date, description.trim(), warningDays);
    setTitle("");
    setDate("");
    setDescription("");
    setWarningDays(7);
  };

  const sorted = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getStatus = (d: ImportantDate) => {
    const days = daysUntil(d.date);
    if (days < 0) return { label: "Past", color: "default" };
    if (days === 0) return { label: "Today!", color: "red" };
    if (days <= d.warningDays) return { label: `${days}d left`, color: "orange" };
    return { label: `${days}d away`, color: "blue" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {sorted.length === 0 ? (
        <Empty description="No important dates yet" />
      ) : (
        <List
          dataSource={sorted}
          renderItem={(d) => {
            const status = getStatus(d);
            return (
              <List.Item
                actions={[
                  <Button key="remove" size="small" danger onClick={() => onRemove(d.id)}>
                    Remove
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {daysUntil(d.date) <= d.warningDays && daysUntil(d.date) >= 0 && (
                        <span style={{ color: "red" }}>★</span>
                      )}
                      <Text strong>{d.title}</Text>
                      <Tag color={status.color}>{status.label}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {formatDate(d.date)}
                        {d.description && ` — ${d.description}`}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "16px",
          border: "0.5px solid #f0f0f0",
          borderRadius: "8px",
        }}
      >
        <Text strong style={{ fontSize: "13px" }}>Add important date</Text>
        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Final exam)"
            style={{ flex: 2 }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              flex: 1,
              padding: "4px 8px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={{ flex: 1 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Text style={{ fontSize: "12px", whiteSpace: "nowrap" }}>Warn</Text>
            <InputNumber
              value={warningDays}
              onChange={(val) => setWarningDays(val ?? 7)}
              min={1}
              max={90}
              style={{ width: "60px" }}
            />
            <Text style={{ fontSize: "12px" }}>days before</Text>
          </div>
          <Button type="primary" onClick={handleAdd}>Add</Button>
        </div>
      </div>
    </div>
  );
}