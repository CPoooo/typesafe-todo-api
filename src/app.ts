import express from "express";
import authRoutes from "./routes/authRoutes";
import todoRoutes from "./routes/todoRoutes";

export const app = express()

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);
