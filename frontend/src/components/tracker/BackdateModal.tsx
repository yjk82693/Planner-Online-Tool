"use client";

import { useState } from "react";
import { Modal, Button, Typography, Checkbox, Tag, Input, InputNumber } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "antd";
import { MandalData, ShopItem } from "@/types/mandal";
import { DailyLog, DailyTaskRecord } from "@/types/dailyLog";
import { isFuture, isToday, formatDisplayDate } from "@/lib/dateUtils";

const { Text } = Typography;

interface SpentItem {
  id: string;
  reason: string;
  points: number;
}

interface Props {
  open: boolean;
  mandal: MandalData;
  shopItems: ShopItem[];
  existingLogs: DailyLog[];
  onSave: (log: DailyLog, spentItems: { reason: string; points: number }[]) => void;
  onClose: () => void;
}

export default function BackdateModal({ open, mandal, shopItems, existingLogs, onSave, onClose }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [spentItems, setSpentItems] = useState<SpentItem[]>([]);
  const [spentReason, setSpentReason] = useState("");
  const [spentPoints, setSpentPoints] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState("");

  const handleDateChange = (date: Dayjs | null) => {
    if (!date) return;
    const key = date.format("YYYY-MM-DD");
    if (isFuture(key) || isToday(key)) return;
    setSelectedDate(key);
    setSpentItems([]);

    const existing = existingLogs.find((l) => l.date === key);
    if (existing) {
      const preChecked = new Set(
        existing.tasks
          .filter((t) => t.completed)
          .map((t) => `${t.subGoalId}-${t.taskIndex}`)
      );
      setChecked(preChecked);
    } else {
      setChecked(new Set());
    }
  };

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const addSpentItem = () => {
    const reason = spentReason === "__custom__" ? customReason.trim() : spentReason;
    if (!reason || !spentPoints || spentPoints <= 0) return;
    setSpentItems((prev) => [
      ...prev,
      { id: Date.now().toString(), reason, points: spentPoints },
    ]);
    setSpentReason("");
    setCustomReason("");
    setSpentPoints(null);
  };

  const removeSpentItem = (id: string) => {
    setSpentItems((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    if (!selectedDate) return;
    const tasks: DailyTaskRecord[] = [];
    mandal.subGoals.forEach((sg) => {
      sg.tasks.forEach((task, i) => {
        if (!task.text.trim()) return;
        tasks.push({
          subGoalId: sg.id,
          subGoalTitle: sg.title,
          subGoalColor: sg.color,
          taskIndex: i,
          taskText: task.text,
          completed: checked.has(`${sg.id}-${i}`),
        });
      });
    });

    onSave(
      {
        date: selectedDate,
        tasks,
        pointsEarned: tasks.filter((t) => t.completed).length,
        createdAt: new Date().toISOString(),
      },
      spentItems.map((s) => ({ reason: s.reason, points: s.points }))
    );

    setSelectedDate(null);
    setChecked(new Set());
    setSpentItems([]);
    setSpentReason("");
    setCustomReason("");
    setSpentPoints(null);
    onClose();
  };

  const disabledDate = (current: Dayjs) => {
    return current && current >= dayjs().startOf("day");
  };

  const totalEarned = checked.size;
  const totalSpent = spentItems.reduce((s, i) => s + i.points, 0);

  return (
    <Modal
      open={open}
      title="Add past day record"
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button
          key="save"
          type="primary"
          disabled={!selectedDate}
          onClick={handleSave}
          style={{ background: "#7F77DD", borderColor: "#7F77DD" }}
        >
          Save {selectedDate ? `(+${totalEarned} C$ / -${totalSpent} C$)` : ""}
        </Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: "6px" }}>
            Select a past date
          </Text>
          <DatePicker
            onChange={handleDateChange}
            disabledDate={disabledDate}
            style={{ width: "100%" }}
            placeholder="Pick a past date"
          />
        </div>

        {selectedDate && (
          <>
            <Text strong style={{ fontSize: "14px" }}>{formatDisplayDate(selectedDate)}</Text>

            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "10px 12px",
                background: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              <Tag color="green">+{totalEarned} C$ earned</Tag>
              <Tag color="red">-{totalSpent} C$ spent</Tag>
              <Tag color="blue">Net: {totalEarned - totalSpent} C$</Tag>
            </div>

            <div>
              <Text strong style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>
                Mandal-art tasks completed
              </Text>
              <Text type="secondary" style={{ fontSize: "11px", display: "block", marginBottom: "10px" }}>
                Check tasks you completed on this day.
              </Text>

              {mandal.subGoals.map((sg) => {
                const validTasks = sg.tasks.filter((t) => t.text.trim());
                if (validTasks.length === 0) return null;

                return (
                  <div key={sg.id} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <div
                        style={{
                          width: "10px", height: "10px",
                          borderRadius: "2px",
                          background: sg.color,
                          flexShrink: 0,
                        }}
                      />
                      <Text strong style={{ fontSize: "12px" }}>
                        {sg.title || `Sub-goal ${sg.id + 1}`}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px",
                        paddingLeft: "18px",
                      }}
                    >
                      {sg.tasks.map((task, i) => {
                        if (!task.text.trim()) return null;
                        const key = `${sg.id}-${i}`;
                        return (
                          <div
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 6px",
                              borderRadius: "4px",
                              background: checked.has(key) ? sg.color + "33" : "transparent",
                              cursor: "pointer",
                            }}
                            onClick={() => toggle(key)}
                          >
                            <Checkbox
                              checked={checked.has(key)}
                              onChange={() => toggle(key)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Text style={{ fontSize: "11px" }}>{task.text}</Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                borderTop: "0.5px solid #f0f0f0",
                paddingTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <Text strong style={{ fontSize: "13px" }}>Points spent that day</Text>

              {spentItems.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "#fff5f5",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  <Text style={{ fontSize: "12px" }}>{s.reason}</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Tag color="red">-{s.points} C$</Tag>
                    <Button size="small" type="text" danger onClick={() => removeSpentItem(s.id)}>✕</Button>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={spentReason}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSpentReason(val);
                    if (val !== "__custom__") {
                      const selected = shopItems.find((s) => s.name === val);
                      if (selected) setSpentPoints(selected.cost);
                      else setSpentPoints(null);
                    } else {
                      setSpentPoints(null);
                    }
                  }}
                  style={{
                    flex: 2,
                    padding: "4px 8px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    fontSize: "13px",
                    minWidth: "150px",
                  }}
                >
                  <option value="">Select from shop...</option>
                  {shopItems.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.cost} C$)
                    </option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>

                {spentReason === "__custom__" && (
                  <Input
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Custom reason"
                    style={{ flex: 1, minWidth: "100px" }}
                  />
                )}

                <InputNumber
                  value={spentPoints}
                  onChange={(val) => setSpentPoints(val)}
                  placeholder="Cost"
                  min={1}
                  style={{ width: "80px" }}
                />
                <Button onClick={addSpentItem}>Add</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}