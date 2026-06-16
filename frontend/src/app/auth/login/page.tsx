"use client";

import { useState } from "react";
import { Form, Input, Button, Typography, Tabs, Alert, Tag } from "antd";
import { login, register } from "@/lib/auth";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("login");
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  const handleSubmit = async (values: {
    userId?: string;
    email?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    confirm?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "register") {
        if (values.password !== values.confirm) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const data = await register(
          values.email!,
          values.password,
          values.firstName!,
          values.lastName!
        );
        setRegisteredId(data.userId);
        return;
      } else {
        await login(values.userId!, values.password);
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (registeredId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "40px",
            width: "100%",
            maxWidth: "400px",
            border: "0.5px solid #f0f0f0",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#7F77DD",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontSize: "20px", fontWeight: 500 }}>P</span>
          </div>
          <Title level={4} style={{ margin: 0 }}>Account created!</Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Your auto-generated user ID is:
          </Text>
          <Tag
            color="purple"
            style={{ fontSize: "18px", padding: "8px 20px", borderRadius: "8px" }}
          >
            {registeredId}
          </Tag>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Save this ID — you will use it to log in.
          </Text>
          <Button
            type="primary"
            block
            size="large"
            style={{ background: "#7F77DD", borderColor: "#7F77DD" }}
            onClick={() => router.push("/")}
          >
            Go to planner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
          border: "0.5px solid #f0f0f0",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#7F77DD",
              borderRadius: "12px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontSize: "20px", fontWeight: 500 }}>P</span>
          </div>
          <Title level={4} style={{ margin: 0 }}>Planner</Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Your personal goal tracker
          </Text>
        </div>

        <Tabs
          activeKey={tab}
          onChange={(k: string) => { setTab(k); setError(null); }}
          centered
          items={[
            { key: "login", label: "Login" },
            { key: "register", label: "Register" },
          ]}
        />

        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          {tab === "register" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <Form.Item
                label="First name"
                name="firstName"
                style={{ flex: 1 }}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Yoojun" />
              </Form.Item>
              <Form.Item
                label="Last name"
                name="lastName"
                style={{ flex: 1 }}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Kim" />
              </Form.Item>
            </div>
          )}

          {tab === "login" ? (
            <Form.Item
              label="User ID"
              name="userId"
              rules={[{ required: true, message: "Please enter your user ID" }]}
            >
              <Input placeholder="e.g. yjk8234" size="large" />
            </Form.Item>
          ) : (
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="you@example.com" size="large" />
            </Form.Item>
          )}

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          {tab === "register" && (
            <Form.Item
              label="Confirm password"
              name="confirm"
              rules={[{ required: true, message: "Please confirm your password" }]}
            >
              <Input.Password placeholder="••••••••" size="large" />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{ background: "#7F77DD", borderColor: "#7F77DD" }}
            >
              {tab === "login" ? "Login" : "Create account"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}