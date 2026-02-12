import { Router } from "express";
import { getAuthority, createAuthority, UpdateAuthority, DeleteAuthority } from "../controller/auth.controller"
import { login } from "../controller/login.controller";

const router = Router();

router.get("/user", getAuthority);
router.post("/user", createAuthority);
router.put("/user", UpdateAuthority);
router.delete("/user", DeleteAuthority);

router.post("/login", login);

export default router;