import { Response, NextFunction } from "express";
import crypto from "crypto";
import User from "../models/User";
import Profile from "../models/Profile";
import EmployeeDocument from "../models/Document";
import { profileUpdateSchema, adminProfileUpdateSchema } from "../utils/validators";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import { sendInvitationEmail } from "../services/emailService";

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, "User not found");
    const profile = await Profile.findOne({ userId: user._id });
    const documents = await EmployeeDocument.find({ userId: user._id });
    res.json({ user, profile, documents });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: parsed.data },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function listEmployees(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const search = (req.query.search as string) || "";
    const statusParam = (req.query.status as string) || "active";

    // Backend Enforcement: Exclude HR/Admin accounts and filter ONLY role = "EMPLOYEE"
    const filterConditions: any[] = [{ role: "EMPLOYEE" }];

    if (statusParam === "inactive") {
      filterConditions.push({ status: "inactive" });
    } else if (statusParam === "active") {
      filterConditions.push({ status: { $ne: "inactive" } });
    }

    if (search) {
      filterConditions.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ],
      });
    }

    const filter = { $and: filterConditions };
    const users = await User.find(filter).sort({ createdAt: -1 });

    // Fetch profiles for employees to include designation and department
    const userIds = users.map((u) => u._id);
    const profiles = await Profile.find({ userId: { $in: userIds } });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const usersWithProfile = users.map((u) => {
      const p = profileMap.get(u._id.toString());
      return {
        _id: u._id,
        employeeId: u.employeeId,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        invitationStatus: u.invitationStatus || "active",
        status: u.status || "active",
        createdAt: u.createdAt,
        jobTitle: p?.jobTitle || "",
        department: p?.department || "",
      };
    });

    res.json({ users: usersWithProfile });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "Employee not found");
    const profile = await Profile.findOne({ userId: user._id });
    const documents = await EmployeeDocument.find({ userId: user._id });
    res.json({ user, profile, documents });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = adminProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { name, ...profileFields } = parsed.data;
    if (name) {
      await User.findByIdAndUpdate(req.params.id, { name });
    }
    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.id },
      { $set: profileFields },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

// HR/Admin: Soft-delete/deactivate employee account
export async function removeEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    let user = await User.findById(id);
    if (!user) {
      user = await User.findOne({ employeeId: id });
    }

    if (!user) {
      return res.status(404).json({ message: "Employee account not found." });
    }

    // Security Check 1: HR cannot remove their own account
    if (user._id.toString() === req.user!.id.toString()) {
      return res.status(400).json({ message: "You cannot remove your own HR/Admin account." });
    }

    // Security Check 2: Cannot remove another HR/Admin account
    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "You cannot remove an HR/Admin account. Only employee accounts can be removed." });
    }

    user.status = "inactive";
    await user.save();

    res.json({
      message: "Employee account removed successfully. Attendance, leave, and payroll history preserved.",
    });
  } catch (err) {
    next(err);
  }
}

// HR/Admin: Create New Employee and Send Invitation Email
export async function createEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId, name, email, department, designation } = req.body;

    if (!employeeId || !name || !email) {
      return res.status(400).json({ message: "Employee ID, Full Name, and Work Email are required." });
    }

    const lowerEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ $or: [{ email: lowerEmail }, { employeeId }] });
    if (existing) {
      return res.status(409).json({ message: "An account with this email or Employee ID already exists." });
    }

    // Generate secure 32-byte raw token and 24-hour expiration
    const rawToken = crypto.randomBytes(32).toString("hex");
    const invitationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      employeeId: employeeId.trim(),
      name: name.trim(),
      email: lowerEmail,
      role: "EMPLOYEE", // HR can only onboard EMPLOYEES
      emailVerified: false,
      invitationStatus: "pending",
      invitationTokenHash,
      invitationExpiresAt,
      status: "active",
    });

    await Profile.create({
      userId: user._id,
      department: department?.trim() || "",
      jobTitle: designation?.trim() || "",
    });

    // Send Invitation Email to employee
    await sendInvitationEmail(lowerEmail, employeeId, rawToken);

    res.status(201).json({
      message: "Employee created. Invitation email sent successfully.",
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        invitationStatus: user.invitationStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

// HR/Admin: Resend Invitation Email to Pending Employee
export async function resendEmployeeInvitation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id || req.body.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Employee not found." });
    }

    if (user.invitationStatus === "active") {
      return res.status(400).json({ message: "This employee account is already active." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const invitationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.invitationTokenHash = invitationTokenHash;
    user.invitationExpiresAt = invitationExpiresAt;
    await user.save();

    await sendInvitationEmail(user.email, user.employeeId, rawToken);

    res.json({ message: "Invitation email resent successfully." });
  } catch (err) {
    next(err);
  }
}

export async function uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ApiError(400, "No file uploaded");
    const fileUrl = `/uploads/${req.file.filename}`;
    const type = (req.body.type as string) || "document";

    if (type === "profilePicture") {
      await Profile.findOneAndUpdate(
        { userId: req.user!.id },
        { $set: { profilePictureUrl: fileUrl } },
        { upsert: true }
      );
      return res.json({ fileUrl, type });
    }

    const doc = await EmployeeDocument.create({ userId: req.user!.id, fileUrl, type });
    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
}
