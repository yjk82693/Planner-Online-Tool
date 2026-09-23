"use client";

import { useState, useEffect } from "react";
import { Button, Input, Collapse, Checkbox, Tag, Typography, Empty, Tabs, Badge, Modal, Card, Alert, Spin } from "antd";
import { Course, CourseCategory, CourseAssignment } from "@/types/mandal";
import { api } from "@/lib/api";

const { Text } = Typography;

interface CanvasPreviewItem {
  courseCode: string;
  count: number;
  items: { title: string; date: string; uid: string }[];
}

interface Props {
  courses: Course[];
  onAdd: (name: string, category: CourseCategory) => void;
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
  onAddAssignment: (courseId: string, text: string) => void;
  onToggleAssignment: (courseId: string, assignmentId: string) => void;
  onAddContent: (courseId: string, text: string) => void;
  onAddReview: (courseId: string, text: string) => void;
  onImportCanvasCourse: (payload: {
    courseName: string;
    category: CourseCategory;
    items: { title: string; date: string; uid: string }[];
  }) => Promise<unknown>;
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

function CanvasImportSection({
  onImportCanvasCourse,
}: {
  onImportCanvasCourse: Props["onImportCanvasCourse"];
}) {
  const [feedUrl, setFeedUrl] = useState("");
  const [feedUrlInput, setFeedUrlInput] = useState("");
  const [loadingFeedUrl, setLoadingFeedUrl] = useState(true);
  const [savingFeedUrl, setSavingFeedUrl] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CanvasPreviewItem[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api
      .getCanvasFeedUrl()
      .then((res: { canvasFeedUrl: string | null }) => {
        setFeedUrl(res.canvasFeedUrl ?? "");
        setFeedUrlInput(res.canvasFeedUrl ?? "");
      })
      .catch(() => {})
      .finally(() => setLoadingFeedUrl(false));
  }, []);

  async function handleSaveFeedUrl() {
    setSavingFeedUrl(true);
    try {
      await api.setCanvasFeedUrl(feedUrlInput.trim());
      setFeedUrl(feedUrlInput.trim());
    } finally {
      setSavingFeedUrl(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await api.syncCanvas();
      setPreview(res.preview);
      setSelectedCourses(new Set());
      setModalOpen(true);
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Could not sync with Canvas"
      );
    } finally {
      setSyncing(false);
    }
  }

  function toggleCourseSelection(courseCode: string) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseCode)) next.delete(courseCode);
      else next.add(courseCode);
      return next;
    });
  }

  async function handleImportSelected() {
    if (!preview) return;
    setImporting(true);
    try {
      const toImport = preview.filter((c) => selectedCourses.has(c.courseCode));
      for (const course of toImport) {
        await onImportCanvasCourse({
          courseName: course.courseCode,
          category: "academic",
          items: course.items,
        });
      }
      setModalOpen(false);
      setPreview(null);
    } finally {
      setImporting(false);
    }
  }

  if (loadingFeedUrl) return null;

  return (
    <Card size="small" style={{ background: "#fafafa" }}>
      {!feedUrl ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Text strong style={{ fontSize: "13px" }}>Connect Canvas</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Paste your Canvas calendar feed URL to import courses and assignment due dates.
            Find it in Canvas under Calendar → "Calendar Feed" (bottom-right sidebar).
            It's a private link — keep it out of anything public.
          </Text>
          <div style={{ display: "flex", gap: "8px" }}>
            <Input
              size="small"
              value={feedUrlInput}
              onChange={(e) => setFeedUrlInput(e.target.value)}
              placeholder="https://your-school.instructure.com/feeds/calendars/..."
              style={{ flex: 1 }}
            />
            <Button
              size="small"
              type="primary"
              loading={savingFeedUrl}
              disabled={!feedUrlInput.trim()}
              onClick={handleSaveFeedUrl}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>Canvas feed connected</Text>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button size="small" loading={syncing} onClick={handleSync}>
              Sync from Canvas
            </Button>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setFeedUrl("");
                setFeedUrlInput("");
              }}
            >
              Change link
            </Button>
          </div>
        </div>
      )}

      {syncError && (
        <Alert type="error" message={syncError} showIcon style={{ marginTop: "8px" }} />
      )}

      <Modal
        title="Import from Canvas"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleImportSelected}
        okText={`Import ${selectedCourses.size || ""} course${selectedCourses.size === 1 ? "" : "s"}`}
        okButtonProps={{ disabled: selectedCourses.size === 0, loading: importing }}
      >
        {!preview || preview.length === 0 ? (
          <Empty description="No courses found in your Canvas feed" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {preview.map((course) => (
              <div
                key={course.courseCode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  background: selectedCourses.has(course.courseCode) ? "#e6f4ff" : "transparent",
                }}
              >
                <Checkbox
                  checked={selectedCourses.has(course.courseCode)}
                  onChange={() => toggleCourseSelection(course.courseCode)}
                />
                <Text style={{ flex: 1, fontSize: "13px" }}>{course.courseCode}</Text>
                <Tag>{course.count} item{course.count === 1 ? "" : "s"}</Tag>
              </div>
            ))}
          </div>
        )}
        {importing && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Spin size="small" /> <Text type="secondary" style={{ fontSize: "12px" }}>Importing...</Text>
          </div>
        )}
      </Modal>
    </Card>
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
  onImportCanvasCourse,
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
      <CanvasImportSection onImportCanvasCourse={onImportCanvasCourse} />

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
