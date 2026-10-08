"use client";
import { useEffect } from "react";
import { message } from "antd";
import { getToken } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const KEY = "canvasAutoSyncAt";
const MIN_GAP_MS = 30 * 60 * 1000;

export function useCanvasAutoSync() {
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const last = Number(localStorage.getItem(KEY) || 0);
      if (Date.now() - last < MIN_GAP_MS) return;
    } catch {}
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/canvas/auto-sync`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        try { localStorage.setItem(KEY, String(Date.now())); } catch {}
        if (data.added > 0) {
          message.success(`Canvas: ${data.added} new assignment(s) added`);
          setTimeout(() => window.location.reload(), 1200);
        }
      } catch {}
    })();
  }, []);
}
