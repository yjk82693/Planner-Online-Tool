import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  const courses = await prisma.course.findMany({ where: { userId: req.userId! } });
  return res.json(courses.map((c) => ({
    ...c,
    assignments: JSON.parse(c.assignments),
    contents: JSON.parse(c.contents),
    reviews: JSON.parse(c.reviews),
  })));
});

router.post("/", async (req: AuthRequest, res) => {
  const { name, category } = req.body;
  const course = await prisma.course.create({ data: { userId: req.userId!, name, category } });
  return res.json({ ...course, assignments: [], contents: [], reviews: [] });
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const { assignments, contents, reviews, ...rest } = req.body;
  const course = await prisma.course.update({
    where: { id },
    data: {
      ...rest,
      ...(assignments !== undefined && { assignments: JSON.stringify(assignments) }),
      ...(contents !== undefined && { contents: JSON.stringify(contents) }),
      ...(reviews !== undefined && { reviews: JSON.stringify(reviews) }),
    },
  });
  return res.json({
    ...course,
    assignments: JSON.parse(course.assignments),
    contents: JSON.parse(course.contents),
    reviews: JSON.parse(course.reviews),
  });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  await prisma.course.delete({ where: { id } });
  return res.json({ ok: true });
});

export default router;