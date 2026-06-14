"use client";

import { useState } from "react";
import { Button, Input, Collapse, Checkbox, Tag, Typography, Empty, Tabs, Badge } from "antd";
import { Course, CourseCategory, CourseAssignment } from "@/types/mandal";

const { Text } = Typography;

interface Props {
  courses: Course[];
  onAdd: (name: string, category: CourseCategory) => void;
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
  onAddAssignment: (courseId: string, text: string) => void;
  onToggleAssignment: (courseId: string, assignmentId: string) => void;
  onAddContent: (courseId: string, text: string) => void;
  onAddReview: (courseId: string, text: string) => void;
}

function CourseCard({
  course,
  onComplete,
  onRemove,
  onAddAssignment,
  onToggleAssignment,
  onAddContent,
  onAddReview,
}: {
  course: Course;
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
  onAddAssignment: (courseId: string, text: string) => void;
  onToggleAssignment: (courseId: string, assignmentId: string) => void;
  onAddContent: (courseId: string, text: string) => void;
  onAddReview: (courseId: string, text: string) => void;
}) {
  const [assignmentText, setAssignmentText] = useState("");
  const [contentText, setContentText] = useState("");
  const [reviewText, setReviewText] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        {course.status === "in-progress" && (
          <Button size="small" type="primary" onClick={() => onComplete(course.id)}>
            Mark complete
          </Button>
        )}
        <Button size="small" danger onClick={() => onRemove(course.id)}>Remove</Button>
      </div>

      <div>
        <Text strong style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "6px" }}>
          Assignments
        </Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {course.assignments.map((a: CourseAssignment) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Checkbox
                checked={a.completed}
                onChange={() => onToggleAssignment(course.id, a.id)}
              />
              <Text
                style={{
                  fontSize: "12px",
                  textDecoration: a.completed ? "line-through" : "none",
                  color: a.completed ? "#aaa" : "#333",
                }}
              >
                {a.text}
              </Text>
            </div>
          ))}
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            <Input
              size="small"
              value={assignmentText}
              onChange={(e) => setAssignmentText(e.target.value)}
              placeholder="Add assignment..."
              onPressEnter={() => {
                if (!assignmentText.trim()) return;
                onAddAssignment(course.id, assignmentText.trim());
                setAssignmentText("");
              }}
            />
            <Button
              size="small"
              onClick={() => {
                if (!assignmentText.trim()) return;
                onAddAssignment(course.id, assignmentText.trim());
                setAssignmentText("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Text strong style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "6px" }}>
          Course contents
        </Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {course.contents.map((c, i) => (
            <Text key={i} style={{ fontSize: "12px" }}>• {c}</Text>
          ))}
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            <Input
              size="small"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Add topic/module..."
              onPressEnter={() => {
                if (!contentText.trim()) return;
                onAddContent(course.id, contentText.trim());
                setContentText("");
              }}
            />
            <Button
              size="small"
              onClick={() => {
                if (!contentText.trim()) return;
                onAddContent(course.id, contentText.trim());
                setContentText("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Text strong style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "6px" }}>
          Review notes
        </Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {course.reviews.map((r, i) => (
            <Text key={i} style={{ fontSize: "12px" }}>• {r}</Text>
          ))}
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            <Input
              size="small"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Add review note..."
              onPressEnter={() => {
                if (!reviewText.trim()) return;
                onAddReview(course.id, reviewText.trim());
                setReviewText("");
              }}
            />
            <Button
              size="small"
              onClick={() => {
                if (!reviewText.trim()) return;
                onAddReview(course.id, reviewText.trim());
                setReviewText("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseTracker({
  courses,
  onAdd,
  onComplete,
  onRemove,
  onAddAssignment,
  onToggleAssignment,
  onAddContent,
  onAddReview,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<CourseCategory>("academic");

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newCategory);
    setNewName("");
  };

  const inProgress = courses.filter((c) => c.status === "in-progress");
  const completed = courses.filter((c) => c.status === "completed");

  const renderCourseList = (list: Course[]) => {
    if (list.length === 0) return <Empty description="No courses" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    return (
      <Collapse
        items={list.map((course) => ({
          key: course.id,
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tag color={course.category === "academic" ? "blue" : "purple"}>
                {course.category === "academic" ? "Academic" : "Self-study"}
              </Tag>
              <Text strong style={{ fontSize: "13px" }}>{course.name}</Text>
              <Badge
                count={course.assignments.filter((a) => !a.completed).length}
                style={{ backgroundColor: "#ff4d4f" }}
              />
            </div>
          ),
          children: (
            <CourseCard
              course={course}
              onComplete={onComplete}
              onRemove={onRemove}
              onAddAssignment={onAddAssignment}
              onToggleAssignment={onToggleAssignment}
              onAddContent={onAddContent}
              onAddReview={onAddReview}
            />
          ),
        }))}
        style={{ background: "#fff" }}
      />
    );
  };

  const tabItems = [
    {
      key: "academic",
      label: `Academic (${inProgress.filter((c) => c.category === "academic").length})`,
      children: renderCourseList(inProgress.filter((c) => c.category === "academic")),
    },
    {
      key: "self-study",
      label: `Self-study (${inProgress.filter((c) => c.category === "self-study").length})`,
      children: renderCourseList(inProgress.filter((c) => c.category === "self-study")),
    },
    {
      key: "completed",
      label: `Completed (${completed.length})`,
      children: renderCourseList(completed),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Course name..."
          onPressEnter={handleAdd}
          style={{ flex: 1 }}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as CourseCategory)}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          <option value="academic">Academic</option>
          <option value="self-study">Self-study</option>
        </select>
        <Button type="primary" onClick={handleAdd}>Add</Button>
      </div>

      <Tabs items={tabItems} />
    </div>
  );
}