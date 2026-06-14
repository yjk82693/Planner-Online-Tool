import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const goal = await prisma.mandalGoal.findUnique({ where: { userId: req.userId! } });
  if (!goal) return res.json({ mainGoal: "", subGoals: [] });
  return res.json({ mainGoal: goal.mainGoal, subGoals: JSON.parse(goal.subGoals) });
});

router.put("/", async (req: AuthRequest, res) => {
  const { mainGoal, subGoals } = req.body;
  const goal = await prisma.mandalGoal.upsert({
    where: { userId: req.userId! },
    update: { mainGoal, subGoals: JSON.stringify(subGoals) },
    create: { userId: req.userId!, mainGoal, subGoals: JSON.stringify(subGoals) },
  });
  return res.json({ mainGoal: goal.mainGoal, subGoals: JSON.parse(goal.subGoals) });
});

export default router;