"use client";

import { useState } from "react";
import { Button, List, Tag, Typography, Empty, Divider, Modal } from "antd";
import { PointLog, PlannerState } from "@/types/mandal";
import { DailyLog } from "@/types/dailyLog";
import { generateDailyPDF } from "@/lib/generateDailyPDF";
import BackdateModal from "@/components/tracker/BackdateModal";

const { Text } = Typography;

interface Props {
  logs: PointLog[];
  totalPoints: number;
  state: PlannerState;
  onLogDay: () => void;
  onFinishDay: () => void;
  onBackdate: (log: DailyLog, spentItems: { reason: string; points: number }[]) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function groupByDate(logs: PointLog[]): Record<string, { earned: number; spent: number; reasons: string[] }> {
  const result: Record<string, { earned: number; spent: number; reasons: string[] }> = {};
  logs.forEach((log) => {
    const date = log.date.slice(0, 10);
    if (!result[date]) result[date] = { earned: 0, spent: 0, reasons: [] };
    if (log.type === "earned") result[date].earned += log.points;
    else result[date].spent += log.points;
    if (log.reason) result[date].reasons.push(log.reason);
  });
  return result;
}

export default function PointTracker({ logs, totalPoints, state, onLogDay, onFinishDay, onBackdate }: Props) {
  const [backdateOpen, setBackdateOpen] = useState(false);
  const grouped = groupByDate(logs);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayData = grouped[todayKey];

  const totalEarned = logs.filter((l) => l.type === "earned").reduce((s, l) => s + l.points, 0);
  const totalSpent = logs.filter((l) => l.type === "spent").reduce((s, l) => s + l.points, 0);

  const handleFinishDay = () => {
    Modal.confirm({
      title: "Finish day?",
      content: "This will generate your daily PDF summary and reset all completed tasks for tomorrow.",
      okText: "Finish & download PDF",
      okType: "primary",
      cancelText: "Cancel",
      onOk: () => {
        generateDailyPDF(state);
        onFinishDay();
      },
    });
  };

  const handleDownloadPDF = (date: string) => {
    const dayLogs = logs.filter((l) => l.date.slice(0, 10) === date);
    generateDailyPDF({ ...state, pointLogs: dayLogs });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "12px" }}>
        {[
          { label: "Balance", value: `${totalPoints} C$` },
          { label: "Total earned", value: `${totalEarned} C$` },
          { label: "Total spent", value: `${totalSpent} C$` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ flex: 1, background: "#f5f5f5", borderRadius: "8px", padding: "12px 16px" }}
          >
            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>{stat.label}</Text>
            <Text strong style={{ fontSize: "20px" }}>{stat.value}</Text>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          border: "1px dashed #d9d9d9",
          borderRadius: "8px",
        }}
      >
        <div>
          <Text strong style={{ display: "block" }}>
            Today — {formatDate(new Date().toISOString())}
          </Text>
          {todayData ? (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              +{todayData.earned} C$ earned · -{todayData.spent} C$ spent
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: "12px" }}>No activity logged today</Text>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button onClick={() => setBackdateOpen(true)}>Add past day</Button>
          <Button onClick={onLogDay}>Log day</Button>
          <Button
            type="primary"
            onClick={handleFinishDay}
            style={{ background: "#7F77DD", borderColor: "#7F77DD" }}
          >
            Finish day
          </Button>
        </div>
      </div>

      <Divider style={{ margin: "0" }} />

      {dates.length === 0 ? (
        <Empty description="No activity yet — complete tasks to earn points" />
      ) : (
        <List
          dataSource={dates}
          renderItem={(date) => {
            const { earned, spent, reasons } = grouped[date];
            const isToday = date === todayKey;
            const isBackdate = reasons.some((r) => r.startsWith("[Backdate]"));
            return (
              <List.Item
                style={{
                  background: isToday ? "#fafafa" : "transparent",
                  borderRadius: "6px",
                  padding: "8px 12px",
                }}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Text strong={isToday}>
                        {formatDate(date + "T00:00:00")}
                      </Text>
                      {isToday && <Tag color="blue" style={{ fontSize: "11px" }}>Today</Tag>}
                      {isBackdate && <Tag color="purple" style={{ fontSize: "11px" }}>Backdated</Tag>}
                    </div>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {reasons
                        .filter((r) => !r.startsWith("[Backdate]"))
                        .slice(0, 3)
                        .join(" · ")}
                      {reasons.filter((r) => !r.startsWith("[Backdate]")).length > 3 &&
                        ` +${reasons.filter((r) => !r.startsWith("[Backdate]")).length - 3} more`}
                    </Text>
                  }
                />
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {earned > 0 && <Tag color="green">+{earned} C$</Tag>}
                  {spent > 0 && <Tag color="red">-{spent} C$</Tag>}
                  <Button
                    size="small"
                    onClick={() => handleDownloadPDF(date)}
                  >
                    ↓ PDF
                  </Button>
                </div>
              </List.Item>
            );
          }}
        />
      )}

      <BackdateModal
        open={backdateOpen}
        mandal={state.mandal}
        shopItems={state.shopItems}
        existingLogs={state.dailyLogs}
        onSave={onBackdate}
        onClose={() => setBackdateOpen(false)}
      />
    </div>
  );
}