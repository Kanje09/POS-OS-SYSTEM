import { Router } from "express";
import { getAuthority, createAuthority, UpdateAuthority, DeleteAuthority } from "../auth/controller/auth.controller"

const router = Router();

router.get("/user", getAuthority);
router.post("/user", createAuthority);
router.put("/user", UpdateAuthority);
router.delete("/user", DeleteAuthority);

export default router;