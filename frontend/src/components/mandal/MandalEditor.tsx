"use client";

import { useState } from "react";
import { Input, Button, Card, Typography, Collapse, Tag } from "antd";
import { MandalData, SubGoal } from "@/types/mandal";
import { SUB_GOAL_COLORS } from "@/lib/storage";

const { Text } = Typography;

interface Props {
  mandal: MandalData;
  onMainGoalChange: (val: string) => void;
  onSubGoalChange: (id: number, val: string) => void;
  onTaskTextChange: (subGoalId: number, taskIndex: number, val: string) => void;
  onClose: () => void;
}

export default function MandalEditor({
  mandal,
  onMainGoalChange,
  onSubGoalChange,
  onTaskTextChange,
  onClose,
}: Props) {
  const [activeKey, setActiveKey] = useState<string[]>([]);

  const collapseItems = mandal.subGoals.map((sg: SubGoal) => ({
    key: String(sg.id),
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "3px",
            background: SUB_GOAL_COLORS[sg.id],
            flexShrink: 0,
          }}
        />
        <Text strong style={{ fontSize: "13px" }}>
          {sg.title || `Sub-goal ${sg.id + 1}`}
        </Text>
        <Tag style={{ marginLeft: "auto", fontSize: "11px" }}>
          {sg.tasks.filter((t) => t.text.trim()).length} / 8 tasks
        </Tag>
      </div>
    ),
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Input
          value={sg.title}
          onChange={(e) => onSubGoalChange(sg.id, e.target.value)}
          placeholder={`Sub-goal ${sg.id + 1} title`}
          style={{
            fontWeight: 500,
            borderLeft: `3px solid ${SUB_GOAL_COLORS[sg.id]}`,
            borderRadius: "0 4px 4px 0",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          {sg.tasks.map((task, i) => (
            <Input
              key={task.id}
              value={task.text}
              onChange={(e) => onTaskTextChange(sg.id, i, e.target.value)}
              placeholder={`Task ${i + 1}`}
              size="small"
              prefix={
                <Text type="secondary" style={{ fontSize: "11px", minWidth: "16px" }}>
                  {i + 1}
                </Text>
              }
            />
          ))}
        </div>
      </div>
    ),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", overflow: "auto" }}>
      <Card size="small" style={{ borderLeft: `3px solid #7F77DD`, borderRadius: "0 8px 8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>Main goal</Text>
          <Input
            value={mandal.mainGoal}
            onChange={(e) => onMainGoalChange(e.target.value)}
            placeholder="What is your ultimate goal?"
            size="large"
            style={{ fontWeight: 500 }}
          />
        </div>
      </Card>

      <Collapse
        items={collapseItems}
        activeKey={activeKey}
        onChange={(keys) => setActiveKey(keys as string[])}
        style={{ background: "#fff" }}
      />

      <Button
        type="primary"
        onClick={onClose}
        style={{ alignSelf: "flex-end" }}
      >
        Done — view chart
      </Button>
    </div>
  );
}