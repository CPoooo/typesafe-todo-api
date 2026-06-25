import { Router } from "express";
import { loginHandler } from "../handlers/authHandlers";
import { registerHandler } from "../handlers/authHandlers";

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/signout", signoutHandler); // stateless JWT = mostly a client concern (look into this more)

export default router;