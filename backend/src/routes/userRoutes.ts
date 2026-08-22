import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { getMyProfile, updateMyProfile, uploadFile } from "../controllers/profileController";
import { myAttendance, checkIn, checkOut } from "../controllers/attendanceController";
import { applyLeave, myLeaves } from "../controllers/leaveController";
import { myPayroll } from "../controllers/payrollController";
import { myNotifications, markRead } from "../controllers/notificationController";

const router = Router();
router.use(requireAuth);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);
router.post("/me/upload", upload.single("file"), uploadFile);

router.get("/attendance/me", myAttendance);
router.post("/attendance/checkin", checkIn);
router.post("/attendance/checkout", checkOut);

router.post("/leave", applyLeave);
router.get("/leave/me", myLeaves);

router.get("/payroll/me", myPayroll);

router.get("/notifications/me", myNotifications);
router.patch("/notifications/:id/read", markRead);

export default router;
