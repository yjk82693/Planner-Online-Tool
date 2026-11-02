import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mandalRouter from "./routes/mandal";
import todosRouter from "./routes/todos";
import coursesRouter from "./routes/courses";
import datesRouter from "./routes/dates";
import syllabusRouter from "./routes/syllabus";
import canvasRouter from "./routes/canvas";
import shopRouter from "./routes/shop";
import logsRouter from "./routes/logs";
import authRouter from "./routes/auth";
import { getJwtSecret } from "./lib/jwtSecret";

dotenv.config();

// Stop at startup instead of running with no signing key.
try {
  getJwtSecret();
} catch (err) {
  console.error(`[startup] ${(err as Error).message}`);
  process.exit(1);
}

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3002"],
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/mandal", mandalRouter);
app.use("/api/todos", todosRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/dates", datesRouter);
app.use("/api/syllabus", syllabusRouter);
app.use("/api/canvas", canvasRouter);
app.use("/api/shop", shopRouter);
app.use("/api/logs", logsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

export default app;