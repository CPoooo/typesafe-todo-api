import { Router } from "express";
import { requireAuth } from "../middleware/authenticator";

const router = Router();
router.use(requireAuth); 

router.get("/", getTodos);
router.get("/:id", getTodoById);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;