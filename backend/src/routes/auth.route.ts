import { Router } from "express";
import { getAuthority, postAuthority, UpdateAuthority, DeleteAuthority } from "../controllers/auth.controller"

const router = Router();

router.get("/user", getAuthority);
router.post("/user", postAuthority);
router.put("/user", UpdateAuthority);
router.delete("/user", DeleteAuthority);

export default router;