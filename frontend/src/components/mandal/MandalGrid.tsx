"use client";

import { Tooltip } from "antd";
import { MandalData } from "@/types/mandal";

interface Props {
  mandal: MandalData;
  onMainGoalChange: (val: string) => void;
  onSubGoalChange: (id: number, val: string) => void;
  onTaskTextChange: (subGoalId: number, taskIndex: number, val: string) => void;
  onTaskToggle: (subGoalId: number, taskIndex: number) => void;
}

// Block at (blockRow, blockCol) → subGoal id or "C"
//  0 1 2
//  3 C 4
//  5 6 7
const BLOCK_ID: (number | "C")[][] = [
  [0, 1, 2],
  [3, "C", 4],
  [5, 6, 7],
];

// cellPos 0-8 in a 3x3, center(4) = title
// task index: 0,1,2,3,_,4,5,6,7
function cellToTask(cellPos: number): number | null {
  if (cellPos === 4) return null;
  return cellPos < 4 ? cellPos : cellPos - 1;
}

// sub-goal shown in center block's surrounding cells
// cellPos 0→sg0, 1→sg1, 2→sg2, 3→sg3, 5→sg4, 6→sg5, 7→sg6, 8→sg7
function centerCellToSg(cellPos: number): number {
  return cellPos < 4 ? cellPos : cellPos - 1;
}

export default function MandalGrid({
  mandal,
  onMainGoalChange,
  onSubGoalChange,
  onTaskTextChange,
  onTaskToggle,
}: Props) {
  const { mainGoal, subGoals } = mandal;

  // Build a 9x9 grid row by row
  const rows: React.ReactNode[][] = Array.from({ length: 9 }, () => []);

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const blockId = BLOCK_ID[blockRow][blockCol];
      const isCenter = blockId === "C";
      const subGoal = isCenter ? null : subGoals[blockId as number];
      const color = isCenter ? "#7F77DD" : subGoal!.color;

      for (let cellRow = 0; cellRow < 3; cellRow++) {
        for (let cellCol = 0; cellCol < 3; cellCol++) {
          const globalRow = blockRow * 3 + cellRow;
          const globalCol = blockCol * 3 + cellCol;
          const cellPos = cellRow * 3 + cellCol;
          const key = `${globalRow}-${globalCol}`;
          const isTitleCell = cellPos === 4;
          const taskIndex = cellToTask(cellPos);

          let cell: React.ReactNode;

          if (isCenter) {
            if (isTitleCell) {
              cell = (
                <input
                  key={key}
                  value={mainGoal}
                  onChange={(e) => onMainGoalChange(e.target.value)}
                  placeholder="Main goal"
                  style={{
                    background: color,
                    border: "none",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "2px",
                    color: "#fff",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                  }}
                />
              );
            } else {
              const sgId = centerCellToSg(cellPos);
              const sg = subGoals[sgId];
              cell = (
                <div
                  key={key}
                  style={{
                    background: sg?.color ?? "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 500,
                    padding: "2px",
                    color: "#333",
                    overflow: "hidden",
                    textAlign: "center",
                    lineHeight: 1.2,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {sg?.title || `Goal ${sgId + 1}`}
                </div>
              );
            }
          } else {
            if (isTitleCell) {
              cell = (
                <input
                  key={key}
                  value={subGoal!.title}
                  onChange={(e) => onSubGoalChange(subGoal!.id, e.target.value)}
                  placeholder={`Goal ${subGoal!.id + 1}`}
                  style={{
                    background: color,
                    border: "none",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: 500,
                    padding: "2px",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                    color: "#333",
                  }}
                />
              );
            } else {
              const task = subGoal!.tasks[taskIndex!];
              cell = (
                <Tooltip key={key} title={task.text || "Empty task"}>
                  <div
                    onClick={() => onTaskToggle(subGoal!.id, taskIndex!)}
                    style={{
                      background: task.completed ? color : "#fff",
                      border: "0.5px solid #e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "2px",
                      overflow: "hidden",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <input
                      value={task.text}
                      onChange={(e) => {
                        e.stopPropagation();
                        onTaskTextChange(subGoal!.id, taskIndex!, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Task"
                      style={{
                        background: "transparent",
                        border: "none",
                        textAlign: "center",
                        fontSize: "9px",
                        padding: "0",
                        outline: "none",
                        width: "100%",
                        color: "#333",
                        textDecoration: task.completed ? "line-through" : "none",
                        cursor: "text",
                      }}
                    />
                  </div>
                </Tooltip>
              );
            }
          }

          rows[globalRow][globalCol] = cell;
        }
      }
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        gridTemplateRows: "repeat(9, 1fr)",
        gap: "2px",
        width: "100%",
        height: "100%",
        aspectRatio: "1/1",
        maxHeight: "100%",
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      {rows.flat()}
    </div>
  );
}