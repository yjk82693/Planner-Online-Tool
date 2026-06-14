import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const dates = await prisma.importantDate.findMany({ where: { userId: req.userId! } });
  return res.json(dates);
});

router.post("/", async (req: AuthRequest, res) => {
  const { title, date, description, warningDays } = req.body;
  const d = await prisma.importantDate.create({
    data: { userId: req.userId!, title, date, description, warningDays },
  });
  return res.json(d);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  await prisma.importantDate.delete({ where: { id } });
  return res.json({ ok: true });
});

export default router;