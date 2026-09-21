import { useState, useMemo, useEffect } from "react";
import { Calendar, Modal, Form, Input, InputNumber, TimePicker, Select, Badge, Button, Popconfirm, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getToken } from "@/lib/auth";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Text } = Typography;
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "America/New_York", label: "New York / State College (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "UTC", label: "UTC" },
];

interface ImportantDate {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  timezone?: string;
  warningDays: number;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchImportantDates(): Promise<ImportantDate[]> {
  const res = await fetch(`${BASE}/api/dates`, { headers: authHeaders() });
  if (!res.ok) {
    console.error("Failed to fetch important dates:", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function createImportantDate(payload: Omit<ImportantDate, "id">): Promise<ImportantDate> {
  const res = await fetch(`${BASE}/api/dates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function deleteImportantDate(id: string): Promise<void> {
  await fetch(`${BASE}/api/dates/${id}`, { method: "DELETE", headers: authHeaders() });
}

function toLocalMoment(d: ImportantDate) {
  if (!d.time || !d.timezone) return dayjs(d.date);
  return dayjs.tz(`${d.date} ${d.time}`, "YYYY-MM-DD HH:mm", d.timezone).tz(dayjs.tz.guess());
}

function daysLeft(d: ImportantDate) {
  return toLocalMoment(d).startOf("day").diff(dayjs().startOf("day"), "day");
}

const MAX_BADGES_PER_CELL = 2;

export default function ImportantDatesCalendar({
  initialDates = [],
}: {
  initialDates?: ImportantDate[];
}) {
  const [dates, setDates] = useState<ImportantDate[]>(initialDates);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchImportantDates().then(setDates);
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, ImportantDate[]>();
    for (const d of dates) {
      const key = toLocalMoment(d).format("YYYY-MM-DD");
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return map;
  }, [dates]);

  function handleSelect(value: Dayjs) {
    setSelectedDate(value);
    form.resetFields();
    form.setFieldsValue({ warningDays: 7, timezone: "Asia/Seoul" });
    setModalOpen(true);
  }

  async function handleAdd() {
    const values = await form.validateFields();
    const payload: Omit<ImportantDate, "id"> = {
      title: values.title,
      description: values.description,
      date: selectedDate!.format("YYYY-MM-DD"),
      time: values.time ? (values.time as Dayjs).format("HH:mm") : undefined,
      timezone: values.time ? values.timezone : undefined,
      warningDays: values.warningDays ?? 7,
    };
    const created = await createImportantDate(payload);
    setDates((prev) => [...prev, created]);
    setModalOpen(false);
  }

  async function handleRemove(id: string) {
    await deleteImportantDate(id);
    setDates((prev) => prev.filter((d) => d.id !== id));
  }

  function dateCellRender(value: Dayjs) {
    const key = value.format("YYYY-MM-DD");
    const items = byDay.get(key);
    if (!items?.length) return null;
    const visible = items.slice(0, MAX_BADGES_PER_CELL);
    const overflowCount = items.length - visible.length;
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {visible.map((item) => (
          <li key={item.id} style={{ overflow: "hidden" }}>
            <Badge
              status="processing"
              text={
                <Text ellipsis style={{ maxWidth: 80, fontSize: 12 }}>
                  {item.time ? `${toLocalMoment(item).format("HH:mm")} ` : ""}
                  {item.title}
                </Text>
              }
            />
          </li>
        ))}
        {overflowCount > 0 && (
          <li>
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{overflowCount} more
            </Text>
          </li>
        )}
      </ul>
    );
  }

  return (
    <div>
      <div>
        <Text strong>Upcoming</Text>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {dates
            .filter((d) => daysLeft(d) >= 0)
            .sort((a, b) => toLocalMoment(a).diff(toLocalMoment(b)))
            .map((d) => (
              <li
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <Text strong>{d.title}</Text>
                  <Badge
                    count={`${daysLeft(d)}d left`}
                    style={{ backgroundColor: "#fff7e6", color: "#fa8c16", marginLeft: 8 }}
                  />
                  <div>
                    <Text type="secondary">
                      {toLocalMoment(d).format(d.time ? "MMM D, YYYY h:mm A" : "MMM D, YYYY")}
                      {d.time && d.timezone ? ` (from ${d.time} ${d.timezone})` : ""}
                      {d.description ? ` — ${d.description}` : ""}
                    </Text>
                  </div>
                </div>
                <Popconfirm title="Remove this date?" onConfirm={() => handleRemove(d.id)}>
                  <Button danger size="small" icon={<DeleteOutlined />}>
                    Remove
                  </Button>
                </Popconfirm>
              </li>
            ))}
        </ul>
      </div>

      <div style={{ marginTop: 24, height: 520, overflow: "hidden" }}>
        <Calendar
          fullscreen
          cellRender={(value, info) => (info.type === "date" ? dateCellRender(value) : info.originNode)}
          onSelect={handleSelect}
        />
      </div>

      <Modal
        title={`Add important date — ${selectedDate?.format("MMM D, YYYY") ?? ""}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAdd}
        okText="Add"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="e.g. Final exam" />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input placeholder="Description" />
          </Form.Item>
          <Form.Item name="time" label="Time (optional — leave blank for an all-day date)">
            <TimePicker format="h:mm A" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="timezone" label="Time is in this timezone" initialValue="Asia/Seoul">
            <Select options={TIMEZONE_OPTIONS} />
          </Form.Item>
          <Form.Item name="warningDays" label="Warn how many days before?" initialValue={7}>
            <InputNumber min={0} max={90} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}