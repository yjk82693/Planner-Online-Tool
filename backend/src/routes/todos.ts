import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const todos = await prisma.todo.findMany({ where: { userId: req.userId! } });
  return res.json(todos);
});

router.post("/", async (req: AuthRequest, res) => {
  const { text, priority } = req.body;
  const todo = await prisma.todo.create({ data: { userId: req.userId!, text, priority } });
  return res.json(todo);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const todo = await prisma.todo.update({ where: { id }, data: req.body });
  return res.json(todo);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  await prisma.todo.delete({ where: { id } });
  return res.json({ ok: true });
});

router.get("/", async (req: AuthRequest, res) => {
  const todos = await prisma.todo.findMany({ where: { userId: req.userId! } });
  return res.json(todos);
});

router.post("/", async (req: AuthRequest, res) => {
  const { text, priority } = req.body;
  const todo = await prisma.todo.create({
    data: { userId: req.userId!, text, priority },
  });
  return res.json(todo);
});

export default router;