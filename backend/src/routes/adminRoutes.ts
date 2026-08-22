import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  listEmployees,
  getEmployeeById,
  updateEmployeeById,
  createEmployee,
  resendEmployeeInvitation,
  removeEmployee,
} from "../controllers/profileController";
import { adminAttendance } from "../controllers/attendanceController";
import { allLeaves, reviewLeave } from "../controllers/leaveController";
import { allPayroll, updatePayroll } from "../controllers/payrollController";
import { attendanceSummary } from "../controllers/reportController";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", listEmployees);
router.post("/users", createEmployee);
router.get("/employees", listEmployees);
router.post("/employees", createEmployee);
router.get("/users/:id", getEmployeeById);
router.patch("/users/:id", updateEmployeeById);
router.delete("/users/:id", removeEmployee);
router.delete("/employees/:id", removeEmployee);
router.post("/users/:id/resend-invitation", resendEmployeeInvitation);

router.get("/attendance", adminAttendance);

router.get("/leave", allLeaves);
router.patch("/leave/:id", reviewLeave);

router.get("/payroll", allPayroll);
router.patch("/payroll/:userId", updatePayroll);

router.get("/reports/attendance-summary", attendanceSummary);

export default router;
