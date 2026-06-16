import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const items = await prisma.shopItem.findMany({ where: { userId: req.userId! } });
  return res.json(items);
});

router.post("/", async (req: AuthRequest, res) => {
  const { name, cost } = req.body;
  const item = await prisma.shopItem.create({ data: { userId: req.userId!, name, cost } });
  return res.json(item);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const item = await prisma.shopItem.update({ where: { id }, data: req.body });
  return res.json(item);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  try {
    await prisma.shopItem.delete({ where: { id } });
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "Item not found" });
  }
});

export default router;