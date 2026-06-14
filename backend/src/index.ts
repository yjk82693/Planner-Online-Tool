import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mandalRouter from "./routes/mandal";
import todosRouter from "./routes/todos";
import coursesRouter from "./routes/courses";
import datesRouter from "./routes/dates";
import shopRouter from "./routes/shop";
import logsRouter from "./routes/logs";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/mandal", mandalRouter);
app.use("/api/todos", todosRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/dates", datesRouter);
app.use("/api/shop", shopRouter);
app.use("/api/logs", logsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

export default app;