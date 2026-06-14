import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const logs = await prisma.pointLog.findMany({ where: { userId: req.userId! } });
  const dailyLogs = await prisma.dailyLog.findMany({ where: { userId: req.userId! } });
  return res.json({
    pointLogs: logs,
    dailyLogs: dailyLogs.map((l) => ({ ...l, tasks: JSON.parse(l.tasks) })),
  });
});

router.post("/", async (req: AuthRequest, res) => {
  const { date, points, type, reason } = req.body;
  const log = await prisma.pointLog.create({
    data: { userId: req.userId!, date, points, type, reason },
  });
  return res.json(log);
});

router.post("/daily", async (req: AuthRequest, res) => {
  const { date, tasks, pointsEarned } = req.body;
  const id = date + req.userId!;
  const log = await prisma.dailyLog.upsert({
    where: { id },
    update: { tasks: JSON.stringify(tasks), pointsEarned },
    create: { id, userId: req.userId!, date, tasks: JSON.stringify(tasks), pointsEarned },
  });
  return res.json({ ...log, tasks: JSON.parse(log.tasks) });
});

export default router;