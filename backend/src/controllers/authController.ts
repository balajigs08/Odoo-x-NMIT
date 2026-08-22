import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
import Profile from "../models/Profile";
import Otp, { OtpPurpose } from "../models/Otp";
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  loginSchema,
} from "../utils/validators";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/tokenService";
import { sendOtpEmail, sendVerificationEmail } from "../services/emailService";
import { ApiError } from "../middleware/errorHandler";

// Check if an Admin account already exists
export async function checkAdminStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const adminExists = await User.exists({ role: "ADMIN" });
    res.json({ adminExists: !!adminExists });
  } catch (err) {
    next(err);
  }
}

// Send 6-digit OTP to email
export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, purpose } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    if (purpose === "REGISTRATION") {
      const adminExists = await User.exists({ role: "ADMIN" });
      if (adminExists) {
        return res.status(403).json({
          message: "Public registration is closed. Dayflow employee accounts are created by HR/Admin via invitation email.",
        });
      }

      const existingUser = await User.findOne({ email: lowerEmail });
      if (existingUser && existingUser.emailVerified) {
        return res.status(409).json({ message: "An account with this email already exists. Please sign in." });
      }
    } else if (purpose === "FORGOT_PASSWORD") {
      const existingUser = await User.findOne({ email: lowerEmail });
      if (!existingUser) {
        return res.status(404).json({ message: "No account found with this email address." });
      }
    }

    // Limit repeated OTP requests (rate limiting: max 1 per 30 seconds)
    const recentOtp = await Otp.findOne({ email: lowerEmail, purpose });
    if (recentOtp && (Date.now() - new Date(recentOtp.createdAt).getTime()) < 30000) {
      return res.status(429).json({ message: "Please wait 30 seconds before requesting another OTP." });
    }

    // Delete previous pending OTPs for this email & purpose
    await Otp.deleteMany({ email: lowerEmail, purpose });

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.create({
      email: lowerEmail,
      otpHash,
      purpose: purpose as OtpPurpose,
      expiresAt,
      attempts: 0,
    });

    await sendOtpEmail(lowerEmail, otp, purpose);

    res.json({
      message: `OTP sent to ${lowerEmail}. Please check your email inbox.`,
      expiresInSeconds: 300,
    });
  } catch (err) {
    next(err);
  }
}

// Verify OTP
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, otp, purpose } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    const record = await Otp.findOne({ email: lowerEmail, purpose });
    if (!record) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new OTP." });
    }

    if (record.attempts >= 5) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP code. Please try again." });
    }

    res.json({ message: "OTP verified successfully." });
  } catch (err) {
    next(err);
  }
}

// Register with OTP (Only allowed for Initial Admin Setup)
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { employeeId, name, email, password, otp } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // Security Check: Public registration allowed ONLY if no Admin account exists yet
    const adminExists = await User.exists({ role: "ADMIN" });
    if (adminExists) {
      return res.status(403).json({
        message: "Public registration is disabled because an HR/Admin account already exists. Employees are onboarded by HR.",
      });
    }

    // Verify OTP first
    const record = await Otp.findOne({ email: lowerEmail, purpose: "REGISTRATION" });
    if (!record) {
      return res.status(400).json({ message: "OTP expired or not requested. Please send OTP first." });
    }
    const isValidOtp = await bcrypt.compare(otp, record.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    const existingUser = await User.findOne({ $or: [{ email: lowerEmail }, { employeeId }] });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email or ID already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      employeeId,
      name,
      email: lowerEmail,
      passwordHash,
      role: "ADMIN", // First registration MUST be the HR/Admin account
      emailVerified: true,
      invitationStatus: "active",
    });

    await Profile.create({ userId: user._id });

    // Clean up OTP record
    await Otp.deleteOne({ _id: record._id });

    res.status(201).json({
      message: "Initial HR/Admin account created successfully! You can now sign in.",
    });
  } catch (err) {
    next(err);
  }
}

// Legacy / standard signup handler
export async function signup(req: Request, res: Response, next: NextFunction) {
  if (req.body.otp) {
    return register(req, res, next);
  }
  try {
    const { employeeId, name, email, password, role } = req.body;
    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const lowerEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ $or: [{ email: lowerEmail }, { employeeId }] });
    if (existing) {
      return res.status(409).json({ message: "An account with this email or employee ID already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      employeeId,
      name,
      email: lowerEmail,
      passwordHash,
      role: role || "EMPLOYEE",
      verificationToken,
      emailVerified: true, // Defaulting to verified for ease
    });
    await Profile.create({ userId: user._id });

    res.status(201).json({ message: "Account created. You can now sign in." });
  } catch (err) {
    next(err);
  }
}

// Forgot Password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  req.body.purpose = "FORGOT_PASSWORD";
  return sendOtp(req, res, next);
}

// Reset Password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, otp, newPassword } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    const record = await Otp.findOne({ email: lowerEmail, purpose: "FORGOT_PASSWORD" });
    if (!record) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new OTP." });
    }

    const isValidOtp = await bcrypt.compare(otp, record.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    const user = await User.findOne({ email: lowerEmail }).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Otp.deleteOne({ _id: record._id });

    res.json({ message: "Password reset successful! You can now sign in with your new password." });
  } catch (err) {
    next(err);
  }
}

// Google OAuth Handler
export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, name, googleId, avatar } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: lowerEmail });

    if (user) {
      if (user.status === "inactive") {
        return res.status(403).json({
          message: "Your Dayflow account has been deactivated. Please contact your HR/Admin.",
        });
      }
      // Existing user -> Preserve existing role (ADMIN or EMPLOYEE)
      if (!user.emailVerified) {
        user.emailVerified = true;
      }
      if (googleId && !user.googleId) {
        user.googleId = googleId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      // New user -> ALWAYS create as EMPLOYEE (never HR/ADMIN)
      const employeeId = "EMP-G" + Math.floor(1000 + Math.random() * 9000);
      user = await User.create({
        employeeId,
        name,
        email: lowerEmail,
        role: "EMPLOYEE", // CRITICAL SECURITY RULE: New Google users are always EMPLOYEE
        emailVerified: true,
        googleId: googleId || "google_" + Date.now(),
        avatar,
      });
      await Profile.create({ userId: user._id });
    }

    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id, user.role);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: lowerEmail }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your Dayflow account has been deactivated. Please contact your HR/Admin.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        unverified: true,
        email: user.email,
      });
    }

    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id, user.role);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string;
    if (!token) throw new ApiError(400, "Missing verification token");

    const user = await User.findOne({ verificationToken: token }).select("+verificationToken");
    if (!user) throw new ApiError(400, "Invalid or expired verification token");

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified. You can now sign in." });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, "Missing refresh token");

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "Session no longer valid. Please sign in again.");

    const accessToken = signAccessToken(user._id, user.role);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

export async function activateAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing activation token." });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationStatus: "pending",
    }).select("+invitationTokenHash");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or already used activation token. Please ask HR to resend an invitation link.",
      });
    }

    if (user.invitationExpiresAt && new Date() > user.invitationExpiresAt) {
      return res.status(400).json({
        message: "Activation link has expired (24 hours window). Please contact HR to resend an invitation.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.invitationStatus = "active";
    user.emailVerified = true;
    user.invitationTokenHash = undefined;
    user.invitationExpiresAt = undefined;
    await user.save();

    res.json({ message: "Account activated successfully! You can now sign in to Dayflow." });
  } catch (err) {
    next(err);
  }
}

export async function resendInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const lowerEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ message: "No employee account found with this email." });
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

    const { sendInvitationEmail } = require("../services/emailService");
    await sendInvitationEmail(user.email, user.employeeId, rawToken);

    res.json({ message: "Invitation email resent successfully." });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: "Logged out" });
}
