import { Router } from "express";
import ical from "node-ical";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

function parseSummary(summary: string): { title: string; courseCode: string | null } {
  const match = summary.match(/^(.*)\s\[(.+)\]$/);
  if (!match) return { title: summary.trim(), courseCode: null };
  const title = match[1].trim();
  const courseCode = match[2].split(",")[0].trim();
  return { title, courseCode };
}

router.get("/feed-url", async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  return res.json({ canvasFeedUrl: user?.canvasFeedUrl ?? null });
});

router.put("/feed-url", async (req: AuthRequest, res) => {
  const { canvasFeedUrl } = req.body;
  await prisma.user.update({
    where: { id: req.userId! },
    data: { canvasFeedUrl },
  });
  return res.json({ ok: true });
});

router.post("/sync", async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.canvasFeedUrl) {
    return res.status(400).json({ error: "No Canvas feed URL set for this account" });
  }

  let events;
  try {
    events = await ical.async.fromURL(user.canvasFeedUrl);
  } catch (err) {
    return res.status(400).json({ error: "Could not fetch or parse the Canvas feed" });
  }

  const assignments = Object.values(events).filter(
    (e: any) => e.type === "VEVENT" && e.start
  );

  const byCourse = new Map<string, { title: string; date: string; uid: string }[]>();
  for (const e of assignments as any[]) {
    const { title, courseCode } = parseSummary(e.summary || "Untitled");
    const key = courseCode ?? "Uncategorized";
    const list = byCourse.get(key) ?? [];
    list.push({ title, date: e.start.toISOString(), uid: e.uid });
    byCourse.set(key, list);
  }

  const preview = Array.from(byCourse.entries()).map(([courseCode, items]) => ({
    courseCode,
    count: items.length,
    items,
  }));

  return res.json({ preview });
});

router.post("/import", async (req: AuthRequest, res) => {
  const { courseName, category, items } = req.body as {
    courseName: string;
    category: string;
    items: { title: string; date: string; uid: string }[];
  };

  const course = await prisma.course.create({
    data: { userId: req.userId!, name: courseName, category },
  });

  const assignments = items.map((i) => ({
    id: i.uid,
    text: i.title,
    completed: false,
    dueDate: i.date,
  }));

  await prisma.course.update({
    where: { id: course.id },
    data: { assignments: JSON.stringify(assignments) },
  });

  for (const item of items) {
    await prisma.importantDate.create({
      data: {
        userId: req.userId!,
        title: `${courseName}: ${item.title}`,
        date: item.date.slice(0, 10),
        warningDays: 7,
      },
    });
  }

  return res.json({ ok: true, courseId: course.id, imported: items.length });
});

router.post("/auto-sync", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || !user.canvasFeedUrl) return res.json({ ok: true, added: 0 });

    const ical = require("node-ical");
    const data = await ical.async.fromURL(user.canvasFeedUrl);
    const fmt = (d: any) =>
      new Date(d).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const today = fmt(new Date());

    const byCourse = new Map<string, { uid: string; title: string; date: string }[]>();
    for (const ev of Object.values(data) as any[]) {
      if (ev.type !== "VEVENT" || !ev.start || !ev.summary) continue;
      const summary = String(ev.summary);
      const open = summary.lastIndexOf(" [");
      if (open === -1) continue;
      const title = summary.slice(0, open).trim();
      const code = summary.slice(open + 2).split(",")[0].replace(/\]$/, "").trim();
      const date = fmt(ev.start);
      if (!code || date < today) continue;
      if (!byCourse.has(code)) byCourse.set(code, []);
      byCourse.get(code)!.push({ uid: String(ev.uid), title, date });
    }

    let added = 0;
    for (const [code, items] of byCourse) {
      const course = await prisma.course.findFirst({
        where: { userId: req.userId!, name: code },
      });
      if (!course) continue;

      const current = JSON.parse(course.assignments || "[]") as any[];
      const knownIds = new Set(current.map((a) => a.id));
      const knownTexts = new Set(current.map((a) => String(a.text).trim().toLowerCase()));
      const fresh = items.filter(
        (i) => !knownIds.has(i.uid) && !knownTexts.has(i.title.trim().toLowerCase())
      );
      if (fresh.length === 0) continue;

      const merged = [
        ...current,
        ...fresh.map((i) => ({ id: i.uid, text: i.title, completed: false, dueDate: i.date })),
      ];
      await prisma.course.update({
        where: { id: course.id },
        data: { assignments: JSON.stringify(merged) },
      });

      for (const i of fresh) {
        const title = `${code}: ${i.title}`;
        const dup = await prisma.importantDate.findFirst({
          where: { userId: req.userId!, title, date: i.date },
        });
        if (!dup) {
          await prisma.importantDate.create({
            data: { userId: req.userId!, title, date: i.date, warningDays: 7 },
          });
        }
      }
      added += fresh.length;
    }
    return res.json({ ok: true, added });
  } catch (err) {
    console.error("canvas auto-sync failed", err);
    return res.status(500).json({ ok: false });
  }
});

export default router;
