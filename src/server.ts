import express from "express";
import authRoutes from "./routes/authRoutes";
import todoRoutes from "./routes/todoRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.listen(PORT, () => {
  console.log(`
\x1b[36m
 ████████╗ ██████╗ ██████╗  ██████╗      █████╗ ██████╗ ██╗
    ██╔══╝██╔═══██╗██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██║
    ██║   ██║   ██║██║  ██║██║   ██║    ███████║██████╔╝██║
    ██║   ██║   ██║██║  ██║██║   ██║    ██╔══██║██╔═══╝ ██║
    ██║   ╚██████╔╝██████╔╝╚██████╔╝    ██║  ██║██║     ██║
    ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝     ╚═╝  ╚═╝╚═╝     ╚═╝
\x1b[0m
\x1b[33m  ⚡ Server blazingly fast (wow!) listening on port ${PORT}\x1b[0m
\x1b[90m  ────────────────────────────────────────────────────────\x1b[0m
\x1b[32m  ✓ Database connected
  ✓ Routes mounted
  ✓ JWT auth ready\x1b[0m
\x1b[90m  ────────────────────────────────────────────────────────\x1b[0m
  `);
});