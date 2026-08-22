import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { salarySlip } from "../controllers/reportController";

const router = Router();
router.use(requireAuth);

router.get("/salary-slip/:userId", salarySlip);

export default router;
