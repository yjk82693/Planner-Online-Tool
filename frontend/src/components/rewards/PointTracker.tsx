"use client";

import { useState } from "react";
import { Button, Tag, Typography, Empty, Divider, Modal, Collapse } from "antd";
import { PointLog, PlannerState } from "@/types/mandal";
import { DailyLog } from "@/types/dailyLog";
import { generateDailyPDF, generateBackdatePDF } from "@/lib/generateDailyPDF";
import BackdateModal from "@/components/tracker/BackdateModal";
import JSZip from "jszip";

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

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
}

function groupLogs(logs: PointLog[]): Record<string, { earned: number; spent: number; reasons: string[] }> {
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

interface Hierarchy {
  [year: number]: {
    [month: number]: string[]; // dates YYYY-MM-DD
  };
}

function buildHierarchy(dates: string[]): Hierarchy {
  const h: Hierarchy = {};
  dates.forEach((date) => {
    const [y, m] = date.split("-").map(Number);
    if (!h[y]) h[y] = {};
    if (!h[y][m]) h[y][m] = [];
    h[y][m].push(date);
  });
  return h;
}

export default function PointTracker({ logs, totalPoints, state, onLogDay, onFinishDay, onBackdate }: Props) {
  const [backdateOpen, setBackdateOpen] = useState(false);
  const grouped = groupLogs(logs);
  const allDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayData = grouped[todayKey];
  const hierarchy = buildHierarchy(allDates);

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
    if (date === todayKey) {
      generateDailyPDF(state);
    } else {
      generateBackdatePDF(state, date);
    }
  };

  const handleDownloadMonthZip = async (year: number, month: number, dates: string[]) => {
    const zip = new JSZip();
    const folder = zip.folder(`${year}-${String(month).padStart(2, "0")}`);
    if (!folder) return;

    for (const date of dates) {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      if (date === todayKey) {
        generateDailyPDF(state);
        continue;
      }

      // generate PDF as blob for zip
      const PURPLE: [number, number, number] = [127, 119, 221];
      const LIGHT_PURPLE: [number, number, number] = [206, 203, 246];
      const pageW = 210;
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = 0;

      doc.setFillColor(...PURPLE);
      doc.rect(0, 0, pageW, 36, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("times", "bold");
      doc.text("Planner", margin, 14);
      doc.setFontSize(9);
      doc.setFont("times", "normal");
      doc.setTextColor(...LIGHT_PURPLE);
      doc.text("Daily Summary", margin, 20);
      doc.text(new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      }), margin, 26);
      y = 46;

      const dayLogs = logs.filter((l) => l.date.slice(0, 10) === date);
      const earned = dayLogs.filter((l) => l.type === "earned").reduce((s, l) => s + l.points, 0);
      const spent = dayLogs.filter((l) => l.type === "spent").reduce((s, l) => s + l.points, 0);
      const stats = [
        { label: "Points earned", value: `+${earned} C$` },
        { label: "Points spent", value: `-${spent} C$` },
        { label: "Net", value: `${earned - spent} C$` },
      ];
      const boxW = contentW / 3 - 3;
      stats.forEach((stat, i) => {
        const x = margin + i * (boxW + 4.5);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x, y, boxW, 18, 2, 2, "F");
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(7);
        doc.setFont("times", "normal");
        doc.text(stat.label, x + 4, y + 6);
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text(stat.value, x + 4, y + 14);
      });
      y += 26;

      const dailyLog = state.dailyLogs.find((l) => l.date === date);
      doc.setTextColor(...PURPLE);
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text("Mandal-art — completed tasks", margin, y);
      y += 6;

      if (dailyLog?.tasks?.length) {
        const grp: Record<string, typeof dailyLog.tasks> = {};
        dailyLog.tasks.filter((t) => t.completed).forEach((t) => {
          if (!grp[t.subGoalTitle]) grp[t.subGoalTitle] = [];
          grp[t.subGoalTitle].push(t);
        });
        Object.entries(grp).forEach(([title, tasks]) => {
          if (!tasks.length) return;
          const hex = tasks[0].subGoalColor;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          doc.setFillColor(r, g, b);
          doc.rect(margin, y, 3, tasks.length * 6 + 4, "F");
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(8);
          doc.setFont("times", "bold");
          doc.text(title, margin + 6, y + 4);
          y += 7;
          tasks.forEach((t) => {
            doc.setFont("times", "normal");
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text(`✓  ${t.taskText}`, margin + 8, y);
            y += 5.5;
          });
          y += 3;
        });
      } else {
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text("No mandal-art tasks recorded.", margin + 6, y);
      }

      doc.setFillColor(...PURPLE);
      doc.rect(0, 287, pageW, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("times", "normal");
      doc.text("Generated by Planner", margin, 293);
      doc.text(new Date().toLocaleString(), pageW - margin, 293, { align: "right" });

      const dateFormatted = date.replace(/-/g, "");
      const pdfBlob = doc.output("blob");
      folder.file(`Daily Report - ${dateFormatted}.pdf`, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Planner - ${year}-${String(month).padStart(2, "0")}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const years = Object.keys(hierarchy)
    .map(Number)
    .sort((a, b) => b - a);

  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;

  const defaultActiveYears = years.map(String);
  const defaultActiveMonths = years.flatMap((y) =>
    Object.keys(hierarchy[y]).map((m) => `${y}-${m}`)
  );

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

      {allDates.length === 0 ? (
        <Empty description="No activity yet — complete tasks to earn points" />
      ) : (
        <Collapse
          defaultActiveKey={defaultActiveYears}
          style={{ background: "#fff", border: "none" }}
          items={years.map((year) => ({
            key: String(year),
            label: <Text strong style={{ fontSize: "15px" }}>{year}</Text>,
            style: { border: "0.5px solid #f0f0f0", borderRadius: "8px", marginBottom: "8px" },
            children: (
              <Collapse
                defaultActiveKey={defaultActiveMonths}
                style={{ background: "#fff", border: "none" }}
                items={Object.keys(hierarchy[year])
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map((month) => {
                    const dates = hierarchy[year][month].sort((a, b) => b.localeCompare(a));
                    const monthEarned = dates.reduce((s, d) => s + (grouped[d]?.earned ?? 0), 0);
                    const monthSpent = dates.reduce((s, d) => s + (grouped[d]?.spent ?? 0), 0);
                    return {
                      key: `${year}-${month}`,
                      label: (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <Text strong>{formatMonthYear(year, month)}</Text>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {monthEarned > 0 && <Tag color="green">+{monthEarned} C$</Tag>}
                            {monthSpent > 0 && <Tag color="red">-{monthSpent} C$</Tag>}
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadMonthZip(year, month, dates);
                              }}
                            >
                              ↓ ZIP
                            </Button>
                          </div>
                        </div>
                      ),
                      children: (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {dates.map((date) => {
                            const { earned, spent, reasons } = grouped[date];
                            const isToday = date === todayKey;
                            const isBackdate = reasons.some((r) => r.startsWith("[Backdate]"));
                            return (
                              <div
                                key={date}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  background: isToday ? "#fafafa" : "#fff",
                                  borderRadius: "6px",
                                  border: "0.5px solid #f0f0f0",
                                }}
                              >
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Text strong={isToday} style={{ fontSize: "13px" }}>
                                      {formatDate(date + "T00:00:00")}
                                    </Text>
                                    {isToday && <Tag color="blue" style={{ fontSize: "11px" }}>Today</Tag>}
                                    {isBackdate && <Tag color="purple" style={{ fontSize: "11px" }}>Backdated</Tag>}
                                  </div>
                                  <Text type="secondary" style={{ fontSize: "11px" }}>
                                    {reasons
                                      .filter((r) => !r.startsWith("[Backdate]"))
                                      .slice(0, 3)
                                      .join(" · ")}
                                    {reasons.filter((r) => !r.startsWith("[Backdate]")).length > 3 &&
                                      ` +${reasons.filter((r) => !r.startsWith("[Backdate]")).length - 3} more`}
                                  </Text>
                                </div>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  {earned > 0 && <Tag color="green">+{earned} C$</Tag>}
                                  {spent > 0 && <Tag color="red">-{spent} C$</Tag>}
                                  <Button size="small" onClick={() => handleDownloadPDF(date)}>
                                    ↓ PDF
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ),
                    };
                  })}
              />
            ),
          }))}
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