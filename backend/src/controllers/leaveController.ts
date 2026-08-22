import { Response, NextFunction } from "express";
import crypto from "crypto";
import LeaveRequest from "../models/LeaveRequest";
import Notification from "../models/Notification";
import Attendance from "../models/Attendance";
import User from "../models/User";
import { leaveApplySchema, leaveReviewSchema } from "../utils/validators";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import { sendLeaveReviewEmail, sendLeaveStatusEmail } from "../services/emailService";

// Helper function: Core Leave Review & Attendance Sync Logic
export async function processLeaveReview(
  leaveId: string,
  status: "APPROVED" | "REJECTED",
  reviewerComment?: string,
  reviewerId?: string
) {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) throw new ApiError(404, "Leave request not found");

  leave.status = status;
  leave.reviewerComment = reviewerComment || "";
  if (reviewerId) {
    leave.reviewedBy = reviewerId as any;
  }
  leave.reviewToken = undefined;
  leave.reviewTokenExpiresAt = undefined;
  await leave.save();

  // 1. Attendance Sync: On Approval, mark all dates in date range as LEAVE
  if (status === "APPROVED") {
    const cur = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10);
      await Attendance.findOneAndUpdate(
        { userId: leave.userId, date: dateStr },
        { $set: { status: "LEAVE" } },
        { upsert: true }
      );
      cur.setDate(cur.getDate() + 1);
    }
  }

  // 2. In-App Notification
  await Notification.create({
    userId: leave.userId,
    message: `Your ${leave.leaveType.toLowerCase()} leave request (${leave.startDate} to ${leave.endDate}) was ${status.toLowerCase()}.`,
  });

  // 3. Email Notification to Employee
  const employee = await User.findById(leave.userId);
  if (employee?.email) {
    await sendLeaveStatusEmail(
      employee.email,
      leave.leaveType,
      leave.startDate,
      leave.endDate,
      status,
      reviewerComment
    );
  }

  return leave;
}

export async function applyLeave(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = leaveApplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { leaveType, startDate, endDate, remarks } = parsed.data;

    if (new Date(startDate) > new Date(endDate)) {
      throw new ApiError(400, "Start date must be before end date");
    }

    const overlap = await LeaveRequest.findOne({
      userId: req.user!.id,
      status: { $in: ["PENDING", "APPROVED"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    if (overlap) {
      throw new ApiError(409, "You already have a leave request that overlaps these dates");
    }

    // Generate secure single-use review token for HR email approval link
    const rawToken = crypto.randomBytes(32).toString("hex");
    const reviewTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const reviewTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const leave = await LeaveRequest.create({
      userId: req.user!.id,
      leaveType,
      startDate,
      endDate,
      remarks,
      reviewToken: reviewTokenHash,
      reviewTokenExpiresAt,
    });

    // Find HR/Admin user to send email notification
    const employee = await User.findById(req.user!.id);
    const hrAdmin = await User.findOne({ role: "ADMIN" });
    const hrEmail = hrAdmin?.email || process.env.SMTP_EMAIL || "admin@dayflow.io";

    if (employee && hrEmail) {
      sendLeaveReviewEmail(
        hrEmail,
        employee.name,
        employee.employeeId,
        leaveType,
        startDate,
        endDate,
        remarks || "",
        rawToken
      ).catch((err) => console.error("Error sending leave email:", err));
    }

    res.status(201).json({ leave });
  } catch (err) {
    next(err);
  }
}

export async function myLeaves(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const leaves = await LeaveRequest.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (err) {
    next(err);
  }
}

export async function allLeaves(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const filter = status ? { status } : {};
    const rawLeaves = await LeaveRequest.find(filter)
      .populate("userId", "name employeeId email")
      .sort({ createdAt: -1 });
    const leaves = rawLeaves.filter((l) => l.userId != null);
    res.json({ leaves });
  } catch (err) {
    next(err);
  }
}

// HR Dashboard Review API (PATCH /admin/leave/:id)
export async function reviewLeave(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = leaveReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { status, reviewerComment } = parsed.data;

    const leave = await processLeaveReview(req.params.id, status, reviewerComment, req.user!.id);
    res.json({ leave });
  } catch (err) {
    next(err);
  }
}

// Public/Auth Token-Based Details Fetch (GET /auth/leave-review-info?token=...)
export async function getLeaveByToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rawToken = req.query.token as string;
    if (!rawToken) {
      return res.status(400).json({ message: "Review token is required." });
    }

    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const leave = await LeaveRequest.findOne({ reviewToken: hashedToken }).populate(
      "userId",
      "name employeeId email"
    );

    if (!leave) {
      return res.status(404).json({ message: "Invalid or expired leave review link." });
    }

    if (leave.reviewTokenExpiresAt && new Date() > leave.reviewTokenExpiresAt) {
      return res.status(400).json({ message: "This leave review link has expired." });
    }

    res.json({ leave });
  } catch (err) {
    next(err);
  }
}

// Public/Auth Token-Based Website Review API (POST /auth/review-leave)
export async function reviewLeaveByToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token, status, reviewerComment } = req.body;
    if (!token || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Token and valid status (APPROVED or REJECTED) are required." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const leave = await LeaveRequest.findOne({ reviewToken: hashedToken });

    if (!leave) {
      return res.status(404).json({ message: "Invalid or already used leave review token." });
    }

    if (leave.reviewTokenExpiresAt && new Date() > leave.reviewTokenExpiresAt) {
      return res.status(400).json({ message: "This leave review token has expired." });
    }

    const reviewerId = req.user ? req.user.id : undefined;
    const updatedLeave = await processLeaveReview(leave._id.toString(), status, reviewerComment, reviewerId);

    res.json({
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leave: updatedLeave,
    });
  } catch (err) {
    next(err);
  }
}
