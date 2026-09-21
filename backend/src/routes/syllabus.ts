import { Router } from "express";
import multer from "multer";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { parseSyllabusText } from "../lib/syllabusParser";

const upload = multer({ dest: "/tmp/syllabus-uploads" });
const router = Router();
router.use(authMiddleware);

router.post("/upload", upload.single("file"), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  let text = "";

  try {
    if (req.file.mimetype === "application/pdf") {
      const buffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      text = parsed.text;
    } else if (
      req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else {
      text = await fs.readFile(filePath, "utf-8");
    }
  } catch (err) {
    await fs.unlink(filePath).catch(() => {});
    return res.status(400).json({ error: "Could not read file" });
  }

  await fs.unlink(filePath).catch(() => {});

  const items = parseSyllabusText(text);
  return res.json({ items });
});

router.post("/import", async (req: AuthRequest, res) => {
  const { courseName, category, items } = req.body as {
    courseName: string;
    category: string;
    items: { title: string; date: string }[];
  };

  const course = await prisma.course.create({
    data: { userId: req.userId!, name: courseName, category },
  });

  const assignments = items.map((i, idx) => ({
    id: `${course.id}-${idx}`,
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
        date: item.date,
        warningDays: 7,
      },
    });
  }

  return res.json({ ok: true, courseId: course.id, imported: items.length });
});

export default router;
