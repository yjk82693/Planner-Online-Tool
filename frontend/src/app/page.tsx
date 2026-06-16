"use client";

import { useState, useEffect } from "react";
import { Layout, Menu, Typography, Badge, Modal, Button } from "antd";
import { useRouter } from "next/navigation";
import { usePlanner } from "@/hooks/usePlanner";
import { clearToken } from "@/lib/auth";
import MandalGrid from "@/components/mandal/MandalGrid";
import MandalEditor from "@/components/mandal/MandalEditor";
import Shop from "@/components/rewards/Shop";
import PointTracker from "@/components/rewards/PointTracker";
import TodoList from "@/components/todo/TodoList";
import CourseTracker from "@/components/course/CourseTracker";
import ImportantDates from "@/components/dates/ImportantDates";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

type Tab = "edit" | "mandal" | "todo" | "courses" | "dates" | "shop" | "tracker";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("edit");
  const [warningShown, setWarningShown] = useState(false);
  const {
    state,
    loading,
    setMainGoal,
    setSubGoalTitle,
    setTaskText,
    toggleTask,
    buyItem,
    addShopItem,
    removeShopItem,
    editShopItem,
    logDay,
    finishDay,
    saveBackdateLog,
    addTodo,
    toggleTodo,
    removeTodo,
    setTodoPriority,
    addCourse,
    completeCourse,
    removeCourse,
    addAssignment,
    toggleAssignment,
    addContent,
    addReview,
    addImportantDate,
    removeImportantDate,
  } = usePlanner();

  useEffect(() => {
    if (warningShown) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const urgent = (state.importantDates ?? []).filter((d) => {
      const days = Math.ceil(
        (new Date(d.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days >= 0 && days <= d.warningDays;
    });
    if (urgent.length > 0) {
      setWarningShown(true);
      Modal.warning({
        title: "Upcoming important dates",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {urgent.map((d) => {
              const days = Math.ceil(
                (new Date(d.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={d.id}>
                  <Text strong>★ {d.title}</Text>
                  <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                    {days === 0 ? "Today!" : `${days} day${days > 1 ? "s" : ""} away`}
                    {d.description && ` — ${d.description}`}
                  </Text>
                </div>
              );
            })}
          </div>
        ),
      });
    }
  }, [state.importantDates, warningShown]);

  const menuItems = [
    { key: "edit", label: "Edit goals" },
    { key: "mandal", label: "Mandal-art" },
    { key: "todo", label: "To-do list" },
    { key: "courses", label: "Course tracker" },
    { key: "dates", label: "Important dates" },
    { key: "shop", label: "Shop" },
    { key: "tracker", label: "Point tracker" },
  ];

  const headerTitle: Record<Tab, string> = {
    edit: "Edit goals",
    mandal: "Mandal-art chart",
    todo: "To-do list",
    courses: "Course tracker",
    dates: "Important dates",
    shop: "Reward shop",
    tracker: "Point tracker",
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text type="secondary">Loading...</Text>
      </div>
    );
  }

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider
        width={200}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "24px 16px 16px" }}>
          <Title level={4} style={{ margin: 0 }}>Planner</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[tab]}
          items={menuItems}
          onClick={({ key }) => setTab(key as Tab)}
          style={{ borderRight: "none", flex: 1 }}
        />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <Badge color="gold" text={<Text strong>{state.totalPoints} C$</Text>} />
          <Button
            size="small"
            block
            onClick={() => {
              clearToken();
              router.push("/auth/login");
            }}
          >
            Logout
          </Button>
        </div>
      </Sider>

      <Layout style={{ overflow: "hidden" }}>
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            height: "48px",
            lineHeight: "48px",
          }}
        >
          <Title level={5} style={{ margin: 0 }}>{headerTitle[tab]}</Title>
        </Header>

        <Content
          style={{
            padding: "16px 24px",
            background: "#fff",
            height: "calc(100vh - 48px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {tab === "edit" && (
            <MandalEditor
              mandal={state.mandal}
              onMainGoalChange={setMainGoal}
              onSubGoalChange={setSubGoalTitle}
              onTaskTextChange={setTaskText}
              onClose={() => setTab("mandal")}
            />
          )}

          {tab === "mandal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", minHeight: 0 }}>
              <Text type="secondary" style={{ flexShrink: 0 }}>
                Click a task cell to mark complete (+1 C$). Click again to undo.
              </Text>
              <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ height: "100%", aspectRatio: "1/1", maxHeight: "100%", maxWidth: "100%" }}>
                  <MandalGrid
                    mandal={state.mandal}
                    onMainGoalChange={setMainGoal}
                    onSubGoalChange={setSubGoalTitle}
                    onTaskTextChange={setTaskText}
                    onTaskToggle={toggleTask}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "todo" && (
            <div style={{ overflow: "auto", height: "100%" }}>
              <TodoList
                todos={state.todos}
                importantDates={state.importantDates}
                onAdd={addTodo}
                onToggle={toggleTodo}
                onRemove={removeTodo}
                onSetPriority={setTodoPriority}
              />
            </div>
          )}

          {tab === "courses" && (
            <div style={{ overflow: "auto", height: "100%" }}>
              <CourseTracker
                courses={state.courses}
                onAdd={addCourse}
                onComplete={completeCourse}
                onRemove={removeCourse}
                onAddAssignment={addAssignment}
                onToggleAssignment={toggleAssignment}
                onAddContent={addContent}
                onAddReview={addReview}
              />
            </div>
          )}

          {tab === "dates" && (
            <div style={{ overflow: "auto", height: "100%" }}>
              <ImportantDates
                dates={state.importantDates}
                onAdd={addImportantDate}
                onRemove={removeImportantDate}
              />
            </div>
          )}

          {tab === "shop" && (
            <div style={{ overflow: "auto", height: "100%" }}>
              <Shop
                items={state.shopItems}
                totalPoints={state.totalPoints}
                onBuy={buyItem}
                onAdd={addShopItem}
                onRemove={removeShopItem}
                onEdit={editShopItem}
              />
            </div>
          )}

          {tab === "tracker" && (
            <div style={{ overflow: "auto", height: "100%" }}>
              <PointTracker
                logs={state.pointLogs}
                totalPoints={state.totalPoints}
                state={state}
                onLogDay={logDay}
                onFinishDay={finishDay}
                onBackdate={saveBackdateLog}
              />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}