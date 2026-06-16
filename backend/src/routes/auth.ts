import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

function generateUserId(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toLowerCase();
  const last = lastName.charAt(0).toLowerCase();
  const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  const paddedNum = randomNum.toString().padStart(4, "0");
  return `${first}${randomChar}${last}${paddedNum}`;
}

router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName)
    return res.status(400).json({ error: "Missing fields" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);

  let userId = generateUserId(firstName, lastName);
  while (await prisma.user.findUnique({ where: { userId } })) {
    userId = generateUserId(firstName, lastName);
  }

  const user = await prisma.user.create({
    data: { email, password: hashed, firstName, lastName, userId },
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  return res.json({ token, userId: user.userId, email: user.email });
});

router.post("/login", async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password)
    return res.status(400).json({ error: "Missing fields" });

  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  return res.json({ token, userId: user.userId, email: user.email });
});

export default router;