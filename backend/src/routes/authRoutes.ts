import { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  register,
  signup,
  forgotPassword,
  resetPassword,
  googleAuth,
  verifyEmail,
  activateAccount,
  resendInvitation,
  checkAdminStatus,
  login,
  refresh,
  logout,
} from "../controllers/authController";
import { getLeaveByToken, reviewLeaveByToken } from "../controllers/leaveController";

const router = Router();

router.get("/has-admin", checkAdminStatus);
router.get("/leave-review-info", getLeaveByToken);
router.post("/review-leave", reviewLeaveByToken);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", googleAuth);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuth);
router.get("/verify-email", verifyEmail);
router.post("/activate-account", activateAccount);
router.post("/resend-invitation", resendInvitation);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
