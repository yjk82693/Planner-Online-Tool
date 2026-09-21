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

export default router;
