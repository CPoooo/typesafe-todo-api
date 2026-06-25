import { Router } from "express";
import { login, register, signout } from "../handlers/authHandlers";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/signout", signout);

export default router;